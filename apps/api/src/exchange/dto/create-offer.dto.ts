import { IsString, IsNumber, IsPositive, IsOptional, IsDateString } from 'class-validator';

export class CreateMarketplaceOfferDto {
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
