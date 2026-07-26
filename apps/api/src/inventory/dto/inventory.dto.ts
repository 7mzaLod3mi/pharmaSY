import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  Min,
  IsIn,
  IsInt,
  NotEquals,
} from 'class-validator';
import { MovementType } from '@prisma/client';

export class CreateInventoryBatchDto {
  @IsString()
  productId: string;

  @IsString()
  batchNumber: string;

  @IsDateString()
  expiryDate: string;

  @IsNumber()
  @IsPositive()
  purchaseCost: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  sellingPrice?: number;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdjustStockDto {
  @IsIn([
    MovementType.MANUAL_ADJUSTMENT,
    MovementType.DAMAGED,
    MovementType.EXPIRED,
    MovementType.ADMIN_CORRECTION,
  ])
  type: MovementType;

  @IsInt()
  @NotEquals(0)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInventoryBatchDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  sellingPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
