import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pharmasyn/types';
import { AllowPendingOrganization } from '../common/decorators/allow-pending-organization.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';
import { UserRole } from '@pharmasyn/types';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, MinLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(3)
  tradeRegister: string;

  @IsString()
  @MinLength(5)
  address: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(8)
  phone: string;
}

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller({ path: 'suppliers', version: '1' })
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Post('profile')
  @Roles(UserRole.SUPPLIER)
  @AllowPendingOrganization()
  @RequirePermissions(Permissions.PROFILE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create supplier profile' })
  async createProfile(@CurrentUser() user: JwtPayload, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.createProfile(user.sub, dto);
  }

  @Get('profile')
  @Roles(UserRole.SUPPLIER)
  @AllowPendingOrganization()
  @RequirePermissions(Permissions.PROFILE_READ)
  @ApiOperation({ summary: 'Get current supplier profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.suppliersService.getProfile(user.sub);
  }
}
