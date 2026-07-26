import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ImportService } from './import.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@pharmasyn/types';
import type { JwtPayload } from '@pharmasyn/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';

@ApiTags('import')
@ApiBearerAuth()
@Roles(UserRole.SUPPLIER)
@RequirePermissions(Permissions.IMPORT_MANAGE)
@Controller({ path: 'import', version: '1' })
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('excel')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an Excel file to import supplier products' })
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!user.orgId) {
      throw new BadRequestException(
        'User does not have an associated organization',
      );
    }

    // Must be Excel
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'File must be an Excel spreadsheet (.xlsx or .xls)',
      );
    }

    const importRecord = await this.importService.queueImport(file, user.orgId);
    return {
      message: 'File uploaded and queued for processing',
      importId: importRecord.id,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get import history for the current supplier' })
  async getHistory(@CurrentUser() user: JwtPayload) {
    if (!user.orgId) {
      throw new BadRequestException(
        'User does not have an associated organization',
      );
    }

    return this.importService.getHistory(user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get import status by ID' })
  async getImportStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.orgId) {
      throw new BadRequestException(
        'User does not have an associated organization',
      );
    }

    return this.importService.getStatus(id, user.orgId);
  }
}
