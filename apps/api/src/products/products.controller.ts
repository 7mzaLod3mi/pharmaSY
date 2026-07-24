import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsBoolean, IsNumber, MinLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductsService } from './products.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ProductStatus } from '@pharmasyn/types';
import type { JwtPayload } from '@pharmasyn/types';

export class CreateProductDto {
  @IsString() @MinLength(2)
  tradeNameAr: string;

  @IsString() @MinLength(2)
  tradeNameEn: string;

  @IsOptional() @IsString()
  scientificName?: string;

  @IsOptional() @IsString()
  dosageForm?: string;

  @IsOptional() @IsString()
  strength?: string;

  @IsOptional() @IsString()
  packageSize?: string;

  @IsOptional() @IsString()
  barcode?: string;

  @IsString()
  categoryId: string;

  @IsOptional() @IsString()
  manufacturerId?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsString() @MinLength(1)
  unit: string;

  @IsOptional() @IsString()
  description?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2)
  tradeNameAr?: string;

  @IsOptional() @IsString() @MinLength(2)
  tradeNameEn?: string;

  @IsOptional() @IsString()
  scientificName?: string;

  @IsOptional() @IsString()
  dosageForm?: string;

  @IsOptional() @IsString()
  strength?: string;

  @IsOptional() @IsString()
  packageSize?: string;

  @IsOptional() @IsString()
  barcode?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  manufacturerId?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @IsString()
  unit?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional()
  status?: ProductStatus;
}

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search/list products (public)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'manufacturerId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('manufacturerId') manufacturerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.productsService.findAll({
      search,
      categoryId,
      manufacturerId,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    }, user?.role);
  }

  @Public()
  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Lookup product by barcode (public)' })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product detail with supplier prices (public)' })
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product (admin only)' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    return this.productsService.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: JwtPayload) {
    return this.productsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive product (admin only)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.productsService.remove(id, user.sub);
  }
}
