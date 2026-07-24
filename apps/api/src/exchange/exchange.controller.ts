import { Controller, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExchangeService } from './exchange.service';
import { CreateMarketplaceOfferDto } from './dto/create-offer.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pharmasyn/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@pharmasyn/types';

@ApiTags('exchange')
@ApiBearerAuth()
@Controller({ path: 'exchange', version: '1' })
@RequirePermissions(Permissions.EXCHANGE_MANAGE)
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Post('offers')
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'Publish inventory to the marketplace' })
  async publishOffer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMarketplaceOfferDto,
  ) {
    return this.exchangeService.publishOffer(user.orgId!, dto, user.sub);
  }

  @Delete('offers/:id')
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'Cancel a marketplace offer' })
  async cancelOffer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.exchangeService.cancelOffer(user.orgId!, id, user.sub);
  }
}
