import { IsString, IsNumber, IsOptional, IsDateString, IsPositive, Min, ValidateNested, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryImportRowDto {
  @IsString()
  rowId: string; // Unique fingerprint or index for this row from the frontend

  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsNumber()
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
  @IsString()
  clientMutationId: string;

  @IsOptional()
  @IsString()
  importId?: string; // Optional reference to a ProductImport record if tracking files

  @IsEnum(ImportConflictStrategy)
  conflictStrategy: ImportConflictStrategy;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryImportRowDto)
  rows: InventoryImportRowDto[];
}
