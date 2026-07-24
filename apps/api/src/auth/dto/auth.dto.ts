import { IsEmail, IsString, MinLength, IsIn, IsOptional, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '@pharmasyn/types';

// ─── Register ─────────────────────────────────────────────────────────────────

export class RegisterDto {
  @ApiProperty({ example: 'ahmed@pharmacy.sy' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ahmad' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Hassan' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '+963912345678' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+9639\d{8}|09\d{8})$/, { message: 'Invalid Syrian phone number' })
  phone?: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and numeric characters',
  })
  password: string;

  @ApiProperty({ enum: [UserRole.PHARMACY, UserRole.SUPPLIER], example: UserRole.PHARMACY })
  @IsIn([UserRole.PHARMACY, UserRole.SUPPLIER])
  role: UserRole;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export class LoginDto {
  @ApiProperty({ example: 'ahmed@pharmacy.sy' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  @MinLength(8)
  password: string;
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export class VerifyEmailDto {
  @ApiProperty({ example: 'ahmed@pharmacy.sy' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  otp: string;
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export class ResendOtpDto {
  @ApiProperty({ example: 'ahmed@pharmacy.sy' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email: string;
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ahmed@pharmacy.sy' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email: string;
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStrongPass1!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and numeric characters',
  })
  newPassword: string;
}

// ─── Change Password ──────────────────────────────────────────────────────────

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewStrongPass1!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and numeric characters',
  })
  newPassword: string;
}
