import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryImportRowDto {
  @IsString()
  rowId: string; // Unique fingerprint or index for this row from the frontend

  @IsUUID()
  productId: string;

  @IsString()
  batchNumber: string;

  @IsDateString()
  expiryDate: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  purchaseCost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  supplierReference?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;
}

export enum ImportConflictStrategy {
  SKIP = 'SKIP',
  UPDATE = 'UPDATE',
}

export class CommitInventoryImportDto {
  @IsUUID()
  clientMutationId: string;

  @IsOptional()
  @IsString()
  importId?: string; // Optional reference to a ProductImport record if tracking files

  @IsEnum(ImportConflictStrategy)
  conflictStrategy: ImportConflictStrategy;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryImportRowDto)
  rows: InventoryImportRowDto[];
}
