import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ManufacturersService } from './manufacturers.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@pharmasyn/types';

export class CreateManufacturerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateManufacturerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('manufacturers')
@Controller({ path: 'manufacturers', version: '1' })
export class ManufacturersController {
  constructor(private manufacturersService: ManufacturersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List manufacturers (public)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.manufacturersService.findAll(
      search,
      includeInactive === 'true',
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get manufacturer by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.manufacturersService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create manufacturer (admin only)' })
  create(@Body() dto: CreateManufacturerDto) {
    return this.manufacturersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update manufacturer (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    return this.manufacturersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete/deactivate manufacturer (admin only)' })
  remove(@Param('id') id: string) {
    return this.manufacturersService.remove(id);
  }
}
