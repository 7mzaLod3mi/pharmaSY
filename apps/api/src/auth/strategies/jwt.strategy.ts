import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  AccountVerificationState,
  OrgStatus,
  UserRole,
  UserStatus,
  type JwtPayload,
} from '@pharmasyn/types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'pharmasyn-dev-secret'),
    });
  }

  async validate(payload: JwtPayload) {
    // Check if user still exists and is not banned
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        email: true,
        emailVerifiedAt: true,
        role: true,
        status: true,
        pharmacy: { select: { id: true, status: true } },
        supplier: { select: { id: true, status: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const status = user.status as UserStatus;
    if (status === UserStatus.BANNED || status === UserStatus.SUSPENDED) {
      const accountState =
        status === UserStatus.BANNED
          ? AccountVerificationState.ACCOUNT_BANNED
          : AccountVerificationState.ACCOUNT_SUSPENDED;
      throw new UnauthorizedException({
        code: accountState,
        message:
          status === UserStatus.BANNED
            ? 'Account is banned'
            : 'Account is suspended',
        accountState,
      });
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({
        code: AccountVerificationState.EMAIL_NOT_VERIFIED,
        message: 'Email address has not been verified',
        accountState: AccountVerificationState.EMAIL_NOT_VERIFIED,
      });
    }

    const role = user.role as UserRole;
    const organization =
      role === UserRole.PHARMACY ? user.pharmacy : user.supplier;

    return {
      ...payload,
      email: user.email,
      role,
      status,
      orgId: organization?.id,
      orgStatus: organization?.status as OrgStatus | undefined,
    };
  }
}
