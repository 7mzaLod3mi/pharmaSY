import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PharmaciesService } from './pharmacies.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '@pharmasyn/types';
import { AllowPendingOrganization } from '../common/decorators/allow-pending-organization.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';
import { UserRole } from '@pharmasyn/types';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, MinLength } from 'class-validator';

export class CreatePharmacyDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(3)
  licenseNumber: string;

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

@ApiTags('pharmacies')
@ApiBearerAuth()
@Controller({ path: 'pharmacies', version: '1' })
export class PharmaciesController {
  constructor(private pharmaciesService: PharmaciesService) {}

  @Post('profile')
  @Roles(UserRole.PHARMACY)
  @AllowPendingOrganization()
  @RequirePermissions(Permissions.PROFILE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create pharmacy profile' })
  async createProfile(@CurrentUser() user: JwtPayload, @Body() dto: CreatePharmacyDto) {
    return this.pharmaciesService.createProfile(user.sub, dto);
  }

  @Get('profile')
  @Roles(UserRole.PHARMACY)
  @AllowPendingOrganization()
  @RequirePermissions(Permissions.PROFILE_READ)
  @ApiOperation({ summary: 'Get current pharmacy profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.pharmaciesService.getProfile(user.sub);
  }
}
