import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  DiscountType,
  SalePaymentMethod,
  SaleStatus,
} from '@prisma/client';

export class PosPaymentDto {
  @ApiProperty({ enum: SalePaymentMethod, example: SalePaymentMethod.CASH })
  @IsEnum(SalePaymentMethod)
  method: SalePaymentMethod;

  @ApiProperty({ example: 25000, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'CARD-AUTH-123' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;
}

export class PosDiscountDto {
  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 10, description: 'Fixed amount or percentage value' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(999999999999)
  value: number;
}

export class CreateSaleItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 15000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 500, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  lineDiscountAmount?: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional({ type: PosDiscountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosDiscountDto)
  discount?: PosDiscountDto;

  @ApiPropertyOptional({ type: [PosPaymentDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosPaymentDto)
  payments?: PosPaymentDto[];

  @ApiPropertyOptional({ example: 'Walk-in customer' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @ApiPropertyOptional({ example: '+963912345678' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ format: 'uuid', description: 'Stable client-generated mutation identifier' })
  @IsUUID()
  clientMutationId: string;

  @ApiProperty({ example: 'pos-terminal-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  deviceId: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  clientCreatedAt?: string;
}

export class CreateSaleReturnItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  saleItemId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSaleReturnDto {
  @ApiProperty({ type: [CreateSaleReturnItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleReturnItemDto)
  items: CreateSaleReturnItemDto[];

  @ApiProperty({ example: 'Customer returned unopened medication' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    type: [PosPaymentDto],
    description: 'Must equal the server-computed refundable paid amount',
    default: [],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosPaymentDto)
  refunds?: PosPaymentDto[];

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clientMutationId: string;

  @ApiProperty({ example: 'pos-terminal-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  deviceId: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  clientCreatedAt?: string;
}

export class CancelSaleDto {
  @ApiProperty({ example: 'Transaction entered in error' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    type: [PosPaymentDto],
    description: 'Must equal the remaining paid amount',
    default: [],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosPaymentDto)
  refunds?: PosPaymentDto[];

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clientMutationId: string;

  @ApiProperty({ example: 'pos-terminal-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  deviceId: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  clientCreatedAt?: string;
}

export class SaleQueryDto {
  @ApiPropertyOptional({ enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  staffUserId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
