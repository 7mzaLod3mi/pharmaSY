import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('marketplace')
@Controller({ path: 'marketplace', version: '1' })
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'Search active supplier products' })
  searchProducts(@Query('q') query?: string) {
    return this.marketplaceService.searchProducts(query);
  }
}
