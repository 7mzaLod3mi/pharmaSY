import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@pharmasyn/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pharmasyn/types';

@ApiTags('marketplace')
@ApiBearerAuth()
@Roles(UserRole.PHARMACY)
@RequirePermissions(Permissions.PRODUCTS_READ)
@Controller({ path: 'marketplace', version: '1' })
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('products/:productId')
  @ApiOperation({ summary: 'Compare all active offers for one master product' })
  productOffers(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
  ) {
    return this.marketplaceService.searchProducts(
      undefined,
      undefined,
      100,
      productId,
      user.orgId,
    );
  }

  @Get('products')
  @ApiOperation({ summary: 'Search active supplier products' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  searchProducts(
    @CurrentUser() user: JwtPayload,
    @Query('q') query?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.searchProducts(
      query,
      categoryId,
      limit ? Number(limit) : 50,
      undefined,
      user.orgId,
    );
  }
}
