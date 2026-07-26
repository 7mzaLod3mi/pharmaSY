import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { AllowPendingOrganization } from '../common/decorators/allow-pending-organization.decorator';
import type { JwtPayload } from '@pharmasyn/types';
import { ConfigService } from '@nestjs/config';
import { parseTokenDuration } from './token-duration';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'Account created in PENDING state and verification OTP queued',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a registered email using the six-digit OTP',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verification stage completed and session granted',
  })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.verifyEmail(dto);
    if (data.refreshToken) {
      this.setRefreshCookie(res, data.refreshToken);
    }
    return {
      message: data.message,
      alreadyVerified: data.alreadyVerified,
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
      user: data.user,
      accountState: data.accountState,
    };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the email verification OTP' })
  @ApiResponse({
    status: 200,
    description: 'Generic response; a replacement OTP is queued when eligible',
  })
  resendVerification(@Body() dto: ResendOtpDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a password using a one-time reset token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get tokens' })
  @ApiResponse({
    status: 200,
    description:
      'Authenticated session with accountState describing organization onboarding or approval',
  })
  @ApiResponse({
    status: 401,
    description:
      'Invalid credentials, unverified email, suspended account, or banned account',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(dto);
    this.setRefreshCookie(res, data.refreshToken);

    return {
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
      user: data.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.assertTrustedOrigin(req);
    const cookies = (req as unknown as { cookies?: unknown }).cookies;
    const refreshToken =
      cookies && typeof cookies === 'object'
        ? (cookies as Record<string, unknown>).refresh_token
        : undefined;

    if (typeof refreshToken !== 'string' || !refreshToken) {
      this.clearRefreshCookie(res);
      return this.authService.rejectMissingRefreshToken();
    }

    try {
      const data = await this.authService.refreshTokens(refreshToken);
      this.setRefreshCookie(res, data.refreshToken);

      return {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @AllowPendingOrganization()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke tokens' })
  async logout(
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.assertTrustedOrigin(req);
    const userId = req.user.sub;
    await this.authService.logout(userId);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'lax',
      path: '/api/v1/auth',
      maxAge: parseTokenDuration(
        this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
        '7d',
      ),
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'lax',
      path: '/api/v1/auth',
    });
  }

  private assertTrustedOrigin(req: Request) {
    const origin = req.headers.origin;
    const trustedOrigin = process.env.FRONTEND_URL;
    if (origin && trustedOrigin && origin !== trustedOrigin) {
      throw new ForbiddenException('Untrusted request origin');
    }
  }
}
