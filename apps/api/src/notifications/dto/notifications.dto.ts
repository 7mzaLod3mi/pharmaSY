import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { DigestFrequency, NotificationCategory } from '@prisma/client';

export class NotificationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isRead?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional() @IsBoolean() orders?: boolean;
  @IsOptional() @IsBoolean() marketplace?: boolean;
  @IsOptional() @IsBoolean() inventory?: boolean;
  @IsOptional() @IsBoolean() pharmacyExchange?: boolean;
  @IsOptional() @IsBoolean() productRequests?: boolean;
  @IsOptional() @IsBoolean() adminApproval?: boolean;
  @IsOptional() @IsBoolean() system?: boolean;
  @IsOptional() @IsBoolean() marketing?: boolean;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() inAppEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsEnum(DigestFrequency) digestFrequency?: DigestFrequency;
}
