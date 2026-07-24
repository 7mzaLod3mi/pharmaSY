import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import {
  AccountVerificationState,
  AuthTokens,
  JwtPayload,
  OrgStatus,
  UserRole,
  UserStatus,
} from '@pharmasyn/types';
import { resolveAccountVerificationState } from './account-state';
import { EMAIL_QUEUE } from '../common/queue/email-queue.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException('Administrator accounts cannot be self-registered');
    }
    this.assertEmailDeliveryConfigured();

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email already in use');

    const [passwordHash, otp] = await Promise.all([
      bcrypt.hash(dto.password, 12),
      this.createOtp(),
    ]);

    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone,
          role: dto.role,
          status: UserStatus.PENDING,
        },
      });

      await tx.emailVerification.create({
        data: { userId: created.id, email, otp: otpHash, expiresAt },
      });

      return created;
    });

    await this.enqueueVerificationEmail(email, otp);

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email: dto.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification || !(await bcrypt.compare(dto.otp, verification.otp))) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.deletedAt || user.emailVerifiedAt) {
      return { message: 'If verification is required, a new code has been sent.' };
    }
    this.assertEmailDeliveryConfigured();

    const otp = await this.createOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.emailVerification.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.emailVerification.create({
        data: {
          userId: user.id,
          email: user.email,
          otp: otpHash,
          expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        },
      }),
    ]);

    await this.enqueueVerificationEmail(user.email, otp);
    return { message: 'If verification is required, a new code has been sent.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const genericResponse = {
      message: 'If the account exists, a password reset link has been sent.',
    };
    if (!user || user.deletedAt || !user.emailVerifiedAt) return genericResponse;
    this.assertEmailDeliveryConfigured();

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.passwordReset.create({
      data: { userId: user.id, token: tokenHash, expiresAt },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await this.emailQueue.add('send-email', {
      to: user.email,
      subject: 'PharmaSY password reset',
      html: `<div dir="auto"><h2>إعادة تعيين كلمة المرور</h2><p><a href="${resetUrl}">إعادة تعيين كلمة المرور</a></p><p>This link expires in 30 minutes.</p></div>`,
    });

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashOpaqueToken(dto.token);
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token: tokenHash },
    });

    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: reset.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: Record<string, unknown> }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: {
        pharmacy: {
          select: { id: true, status: true, name: true, rejectionNote: true },
        },
        supplier: {
          select: { id: true, status: true, name: true, rejectionNote: true },
        },
      },
    });

    if (!user || user.deletedAt || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const organization = user.role === UserRole.PHARMACY ? user.pharmacy : user.supplier;
    const accountState = resolveAccountVerificationState({
      role: user.role as UserRole,
      status: user.status as UserStatus,
      emailVerifiedAt: user.emailVerifiedAt,
      organization: organization
        ? { status: organization.status as OrgStatus }
        : null,
    });

    this.assertLoginAllowed(
      accountState,
      organization?.rejectionNote ?? undefined,
      user.role as UserRole,
    );

    const orgId = organization?.id;
    const orgStatus = organization?.status as OrgStatus | undefined;
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      orgId,
      orgStatus,
    });

    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: { isRevoked: true },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshTokenHash,
          expiresAt: this.getRefreshTokenExpiry(),
        },
      }),
    ]);

    const { passwordHash: _passwordHash, pharmacy, supplier, ...safeUser } = user;
    return {
      accessToken: tokens.accessToken,
      expiresIn: 15 * 60,
      refreshToken: tokens.refreshToken,
      user: {
        ...safeUser,
        orgId,
        orgName: organization?.name,
        orgStatus,
        accountState,
        organizationRejectionReason: organization?.rejectionNote ?? undefined,
        requiresOrganizationApproval:
          user.role !== UserRole.ADMIN &&
          accountState !== AccountVerificationState.ACTIVE,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'pharmasyn-dev-refresh-secret',
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      include: {
        pharmacy: { select: { id: true, status: true } },
        supplier: { select: { id: true, status: true } },
      },
    });

    if (!user) throw new UnauthorizedException('Access denied');

    const organization = user.role === UserRole.PHARMACY ? user.pharmacy : user.supplier;
    const accountState = resolveAccountVerificationState({
      role: user.role as UserRole,
      status: user.status as UserStatus,
      emailVerifiedAt: user.emailVerifiedAt,
      organization: organization
        ? { status: organization.status as OrgStatus }
        : null,
    });
    this.assertRefreshAllowed(accountState);

    const activeTokens = await this.prisma.refreshToken.findMany({
      where: { userId: user.id, isRevoked: false, expiresAt: { gt: new Date() } },
    });
    const matched = await this.findMatchingRefreshToken(activeTokens, refreshToken);
    if (!matched) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      orgId: organization?.id,
      orgStatus: organization?.status as OrgStatus | undefined,
    });

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: matched.id },
        data: { isRevoked: true },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: await bcrypt.hash(tokens.refreshToken, 12),
          expiresAt: this.getRefreshTokenExpiry(),
        },
      }),
    ]);

    return { ...tokens, expiresIn: 15 * 60 };
  }

  rejectMissingRefreshToken(): never {
    throw new UnauthorizedException('Refresh token is required');
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  private async findMatchingRefreshToken(
    records: Array<{ id: string; token: string }>,
    rawToken: string,
  ) {
    for (const record of records) {
      if (await bcrypt.compare(rawToken, record.token)) return record;
    }
    return null;
  }

  private getRefreshTokenExpiry(): Date {
    const expiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
    const days = Number.parseInt(expiry.replace('d', ''), 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'pharmasyn-dev-refresh-secret',
        ),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as never,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async createOtp(): Promise<string> {
    return randomInt(100000, 1000000).toString();
  }

  private hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async enqueueVerificationEmail(email: string, otp: string) {
    try {
      await this.emailQueue.add('send-email', {
        to: email,
        subject: 'Verify your PharmaSY email',
        html: `<div dir="auto"><h2>رمز التحقق من البريد الإلكتروني</h2><p style="font-size:24px;font-weight:bold">${otp}</p><p>This code expires in 10 minutes.</p></div>`,
      });
    } catch (error) {
      this.logger.error(`Unable to enqueue verification email for ${email}`, error);
      throw error;
    }
  }

  private assertEmailDeliveryConfigured(): void {
    if (this.configService.get<string>('NODE_ENV') === 'test') return;
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '').trim();
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: 'EMAIL_DELIVERY_NOT_CONFIGURED',
        message:
          'Email verification service is not configured. Contact the platform administrator.',
      });
    }
  }

  private assertLoginAllowed(
    state: AccountVerificationState,
    rejectionReason: string | undefined,
    role: UserRole,
  ): void {
    const failures: Partial<
      Record<
        AccountVerificationState,
        { code: string; message: string; reason?: string }
      >
    > = {
      [AccountVerificationState.EMAIL_NOT_VERIFIED]: {
        code: AccountVerificationState.EMAIL_NOT_VERIFIED,
        message: 'Email address has not been verified',
      },
      [AccountVerificationState.ACCOUNT_SUSPENDED]: {
        code: AccountVerificationState.ACCOUNT_SUSPENDED,
        message: 'Account is suspended',
      },
      [AccountVerificationState.ACCOUNT_BANNED]: {
        code: AccountVerificationState.ACCOUNT_BANNED,
        message: 'Account is banned',
      },
    };

    if (
      role === UserRole.ADMIN &&
      state !== AccountVerificationState.ACTIVE
    ) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Administrator account is not active',
        accountState: state,
      });
    }

    const failure = failures[state];
    if (failure) {
      throw new UnauthorizedException({
        ...failure,
        accountState: state,
        reason: rejectionReason,
      });
    }
  }

  private assertRefreshAllowed(state: AccountVerificationState): void {
    if (
      state === AccountVerificationState.EMAIL_NOT_VERIFIED ||
      state === AccountVerificationState.ACCOUNT_SUSPENDED ||
      state === AccountVerificationState.ACCOUNT_BANNED
    ) {
      throw new UnauthorizedException({
        code: state,
        message:
          state === AccountVerificationState.EMAIL_NOT_VERIFIED
            ? 'Email address has not been verified'
            : state === AccountVerificationState.ACCOUNT_BANNED
              ? 'Account is banned'
              : 'Account is suspended',
        accountState: state,
      });
    }
  }
}
