import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierProductsService } from './supplier-products.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pharmasyn/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';
import { UserRole } from '@pharmasyn/types';

export class QuantityDiscountTierDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minQuantity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;
}

export class UpsertSupplierProductDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minOrder?: number;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsString()
  batchNumber: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuantityDiscountTierDto)
  quantityDiscounts?: QuantityDiscountTierDto[];
}

export class UpdateSupplierProductDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minOrder?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuantityDiscountTierDto)
  quantityDiscounts?: QuantityDiscountTierDto[];
}

@ApiTags('supplier-products')
@ApiBearerAuth()
@Roles(UserRole.SUPPLIER)
@RequirePermissions(Permissions.SUPPLIER_PRODUCTS_MANAGE)
@Controller({ path: 'supplier-products', version: '1' })
export class SupplierProductsController {
  constructor(private supplierProductsService: SupplierProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my supplier product listings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isAvailable', required: false })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isAvailable') isAvailable?: string,
  ) {
    return this.supplierProductsService.findBySupplierId(user.orgId!, {
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      isAvailable:
        isAvailable === 'true'
          ? true
          : isAvailable === 'false'
            ? false
            : undefined,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add/update product in my catalog (upsert)' })
  upsert(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertSupplierProductDto,
  ) {
    return this.supplierProductsService.upsert(user.orgId!, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific supplier product' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierProductDto,
  ) {
    return this.supplierProductsService.update(user.orgId!, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from my catalog' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.supplierProductsService.remove(user.orgId!, id);
  }
}
