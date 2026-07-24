import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, type JwtPayload } from '@pharmasyn/types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/permissions';
import {
  CancelSaleDto,
  CreateSaleDto,
  CreateSaleReturnDto,
  SaleQueryDto,
} from './dto/pos.dto';
import { PosService } from './pos.service';

@ApiTags('pos')
@ApiBearerAuth()
@Roles(UserRole.PHARMACY)
@Controller({ path: 'pos', version: '1' })
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('sales')
  @RequirePermissions(Permissions.POS_SALES_CREATE)
  @ApiOperation({
    summary: 'Record an in-store pharmacy sale',
    description:
      'Atomically records the sale, payments and discounts, deducts stock using FEFO, and supports safe idempotent retries.',
  })
  @ApiCreatedResponse({ description: 'Sale recorded successfully' })
  @ApiBadRequestResponse({ description: 'Invalid pricing, payment, or insufficient stock' })
  @ApiConflictResponse({ description: 'Mutation identity conflict' })
  createSale(@CurrentUser() user: JwtPayload, @Body() dto: CreateSaleDto) {
    return this.posService.createSale(user.orgId!, user.sub, dto);
  }

  @Get('sales')
  @RequirePermissions(Permissions.POS_SALES_READ)
  @ApiOperation({ summary: 'List POS sales for the authenticated pharmacy' })
  @ApiOkResponse({ description: 'Paginated pharmacy-isolated sales' })
  findSales(@CurrentUser() user: JwtPayload, @Query() query: SaleQueryDto) {
    return this.posService.findSales(user.orgId!, query);
  }

  @Get('sales/:saleId')
  @RequirePermissions(Permissions.POS_SALES_READ)
  @ApiOperation({ summary: 'Get a POS sale with items, FEFO allocations, payments and returns' })
  @ApiOkResponse({ description: 'Sale details' })
  @ApiNotFoundResponse({ description: 'Sale not found in this pharmacy' })
  getSale(
    @CurrentUser() user: JwtPayload,
    @Param('saleId', ParseUUIDPipe) saleId: string,
  ) {
    return this.posService.getSale(user.orgId!, saleId);
  }

  @Post('sales/:saleId/returns')
  @RequirePermissions(Permissions.POS_RETURNS_CREATE)
  @ApiOperation({
    summary: 'Record a partial or full patient return',
    description:
      'Restores the exact original inventory batches, records refund payments and updates the sale status atomically.',
  })
  @ApiCreatedResponse({ description: 'Return recorded successfully' })
  @ApiBadRequestResponse({ description: 'Invalid quantity or refund payment total' })
  @ApiConflictResponse({ description: 'Return state or mutation identity conflict' })
  createReturn(
    @CurrentUser() user: JwtPayload,
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: CreateSaleReturnDto,
  ) {
    return this.posService.createReturn(user.orgId!, user.sub, saleId, dto);
  }

  @Post('sales/:saleId/cancel')
  @RequirePermissions(Permissions.POS_SALES_CANCEL)
  @ApiOperation({
    summary: 'Cancel a completed POS sale',
    description:
      'Cancellation is allowed only before any return and restores all original FEFO allocations.',
  })
  @ApiCreatedResponse({ description: 'Sale cancelled and stock restored' })
  @ApiBadRequestResponse({ description: 'Refund payment total is invalid' })
  @ApiConflictResponse({ description: 'Sale state or mutation identity conflict' })
  cancelSale(
    @CurrentUser() user: JwtPayload,
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: CancelSaleDto,
  ) {
    return this.posService.cancelSale(user.orgId!, user.sub, saleId, dto);
  }
}
