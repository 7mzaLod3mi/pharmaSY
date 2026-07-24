import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryBatchDto, AdjustStockDto } from './dto/inventory.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@pharmasyn/types';
import type { JwtPayload } from '@pharmasyn/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';
import { CommitInventoryImportDto } from './dto/import.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@RequirePermissions(Permissions.INVENTORY_READ)
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'List all inventory batches with pagination & search' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.findAllBatches(
      user.orgId!,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('dashboard')
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'Get enterprise inventory metrics' })
  async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.getDashboardMetrics(user.orgId!);
  }

  @Get('alerts/low-stock')
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'Get aggregated low stock alerts' })
  async getLowStockAlerts(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.getLowStockAlerts(user.orgId!);
  }

  @Get('alerts/expiry')
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'Get near expiry and expired batches' })
  async getExpiryAlerts(@CurrentUser() user: JwtPayload, @Query('days') days?: string) {
    return this.inventoryService.getExpiryAlerts(user.orgId!, days ? parseInt(days, 10) : 90);
  }

  @Get('movements')
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'Get global pharmacy movement history' })
  async getGlobalMovements(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getGlobalMovements(
      user.orgId!,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id/movements')
  @Roles(UserRole.PHARMACY)
  @ApiOperation({ summary: 'Get batch movement history' })
  async getMovements(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getBatchMovements(
      user.orgId!,
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post()
  @Roles(UserRole.PHARMACY)
  @RequirePermissions(Permissions.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Manually add a new inventory batch' })
  async createBatch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInventoryBatchDto,
  ) {
    return this.inventoryService.createBatch(user.orgId!, user.sub, dto);
  }

  @Post('import/commit')
  @Roles(UserRole.PHARMACY)
  @RequirePermissions(Permissions.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Commit inventory import rows' })
  async commitImport(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CommitInventoryImportDto,
  ) {
    return this.inventoryService.commitImport(user.orgId!, user.sub, dto);
  }

  @Patch(':id/adjust')
  @Roles(UserRole.PHARMACY)
  @RequirePermissions(Permissions.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Adjust stock quantity for a batch' })
  async adjustStock(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustBatch(user.orgId!, id, user.sub, dto);
  }

  @Delete(':id')
  @Roles(UserRole.PHARMACY)
  @RequirePermissions(Permissions.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Soft delete an inventory batch' })
  async deleteBatch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.inventoryService.deleteBatch(user.orgId!, id, user.sub);
  }
}
