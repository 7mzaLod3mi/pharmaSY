import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ProductRequestsService } from './product-requests.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@pharmasyn/types';
import type { JwtPayload } from '@pharmasyn/types';

export class CreateProductRequestDto {
  @IsString()
  @MinLength(2)
  brandName: string;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  dosageForm?: string;

  @IsOptional()
  @IsString()
  strength?: string;

  @IsOptional()
  @IsString()
  packageSize?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveRequestDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(2)
  tradeNameAr: string;

  @IsString()
  @MinLength(2)
  tradeNameEn: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsOptional()
  @IsUUID()
  manufacturerId?: string;
}

export class RejectRequestDto {
  @IsString()
  @MinLength(3)
  reason: string;
}

export class MergeRequestDto {
  @IsUUID()
  productId: string;
}

@ApiTags('product-requests')
@Controller({ path: 'product-requests', version: '1' })
@ApiBearerAuth()
export class ProductRequestsController {
  constructor(private service: ProductRequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a new product request (Suppliers/Pharmacies)',
  })
  create(
    @Body() dto: CreateProductRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all product requests (Admin only)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id/similar')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Find similar master products for duplicate detection',
  })
  findSimilar(@Param('id') id: string) {
    return this.service.findSimilar(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve request and create master product' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.approve(id, user.sub, dto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject product request' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.reject(id, dto.reason, user.sub);
  }

  @Patch(':id/merge')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Merge request with existing master product' })
  merge(
    @Param('id') id: string,
    @Body() dto: MergeRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.merge(id, dto.productId, user.sub);
  }
}
