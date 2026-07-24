import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@pharmasyn/types';
import type { JwtPayload } from '@pharmasyn/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';

export class RejectOrgDto {
  @IsString()
  @MinLength(10)
  reason: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@RequirePermissions(Permissions.ADMIN_MANAGE)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Dashboard Stats ──────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  // ─── Pending Queue ────────────────────────────────────────────────────────

  @Get('pending/pharmacies')
  @ApiOperation({ summary: 'Get pending pharmacy approvals' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPendingPharmacies(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getPendingPharmacies(+page, +limit);
  }

  @Get('pending/suppliers')
  @ApiOperation({ summary: 'Get pending supplier approvals' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPendingSuppliers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getPendingSuppliers(+page, +limit);
  }

  // ─── Approve / Reject Pharmacies ─────────────────────────────────────────

  @Patch('pharmacies/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pharmacy' })
  approvePharmacy(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.approvePharmacy(id, user.sub);
  }

  @Patch('pharmacies/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pharmacy' })
  rejectPharmacy(
    @Param('id') id: string,
    @Body() dto: RejectOrgDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.rejectPharmacy(id, user.sub, dto.reason);
  }

  // ─── Approve / Reject Suppliers ──────────────────────────────────────────

  @Patch('suppliers/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a supplier' })
  approveSupplier(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.approveSupplier(id, user.sub);
  }

  @Patch('suppliers/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a supplier' })
  rejectSupplier(
    @Param('id') id: string,
    @Body() dto: RejectOrgDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.rejectSupplier(id, user.sub, dto.reason);
  }

  // ─── User Management ─────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  getAllUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllUsers(+page, +limit, role, status);
  }

  @Patch('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user' })
  suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Patch('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a user' })
  activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }
}
