import { ReportExportFormat, ReportLocale, ReportType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReportFiltersDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  status?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  productId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(730)
  expiryDays?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;
}

export class DirectExportQueryDto extends ReportFiltersDto {
  @IsEnum(ReportExportFormat)
  format!: ReportExportFormat;

  @IsOptional()
  @IsEnum(ReportLocale)
  locale: ReportLocale = ReportLocale.EN;
}

export class CreateReportExportDto {
  @IsEnum(ReportType)
  reportType!: ReportType;

  @IsEnum(ReportExportFormat)
  format!: ReportExportFormat;

  @IsOptional()
  @IsEnum(ReportLocale)
  locale: ReportLocale = ReportLocale.EN;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFiltersDto)
  filters: ReportFiltersDto = {};

  @IsOptional()
  @IsString()
  @Length(8, 128)
  clientRequestId?: string;
}

export class ExportListQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
