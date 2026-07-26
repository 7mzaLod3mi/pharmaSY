import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { ReportType } from '@prisma/client';
import { UserRole, type JwtPayload } from '@pharmasyn/types';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/permissions';
import {
  CreateReportExportDto,
  DirectExportQueryDto,
  ExportListQueryDto,
  ReportFiltersDto,
} from './dto/reports.dto';
import { ReportExportsService } from './report-exports.service';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Roles(UserRole.PHARMACY, UserRole.SUPPLIER)
@RequirePermissions(Permissions.REPORTS_READ)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly exports: ReportExportsService,
  ) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'List reports available to the current organization role',
  })
  @ApiOkResponse({ description: 'Role-scoped report catalog' })
  catalog(@CurrentUser() user: JwtPayload) {
    const context = this.context(user);
    return this.reports.catalog(context.role);
  }

  @Post('exports')
  @ApiOperation({
    summary: 'Queue a large Excel or PDF report export',
    description:
      'clientRequestId makes retries idempotent. Data scope is always derived from the authenticated organization.',
  })
  @ApiBody({ type: CreateReportExportDto })
  @ApiCreatedResponse({
    description: 'Export queued, or existing idempotent request returned',
  })
  createExport(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReportExportDto,
  ) {
    return this.exports.create(this.context(user), dto);
  }

  @Get('exports')
  @ApiOperation({ summary: 'List exports requested by the current user' })
  listExports(
    @CurrentUser() user: JwtPayload,
    @Query() query: ExportListQueryDto,
  ) {
    return this.exports.list(this.context(user), query);
  }

  @Get('exports/:id')
  @ApiOperation({ summary: 'Get the state of a queued report export' })
  getExport(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.exports.get(this.context(user), id);
  }

  @Get('exports/:id/download')
  @ApiOperation({
    summary: 'Create a short-lived signed URL for a completed private export',
  })
  @ApiConflictResponse({ description: 'Export is not complete' })
  downloadExport(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.exports.download(this.context(user), id);
  }

  @Post('exports/:id/retry')
  @ApiOperation({ summary: 'Retry a failed report export' })
  retryExport(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.exports.retry(this.context(user), id);
  }

  @Get(':reportType/export')
  @ApiOperation({
    summary: 'Generate a bounded synchronous Excel or PDF export',
  })
  @ApiParam({ name: 'reportType', enum: ReportType })
  @ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async directExport(
    @CurrentUser() user: JwtPayload,
    @Param('reportType', new ParseEnumPipe(ReportType))
    reportType: ReportType,
    @Query() query: DirectExportQueryDto,
    @Res() response: Response,
  ) {
    const generated = await this.exports.direct(
      reportType,
      this.context(user),
      query,
      query.format,
      query.locale,
    );
    response.setHeader('Content-Type', generated.file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${generated.fileName}"`,
    );
    response.setHeader('X-Report-Row-Count', String(generated.rowCount));
    response.send(generated.file.buffer);
  }

  @Get(':reportType')
  @ApiOperation({ summary: 'Get a paginated organization-scoped report' })
  @ApiParam({ name: 'reportType', enum: ReportType })
  getReport(
    @CurrentUser() user: JwtPayload,
    @Param('reportType', new ParseEnumPipe(ReportType))
    reportType: ReportType,
    @Query() filters: ReportFiltersDto,
  ) {
    return this.reports
      .generate(reportType, this.context(user), filters)
      .then((result) => this.reports.paginate(result, filters));
  }

  private context(user: JwtPayload) {
    if (!user.orgId) {
      throw new BadRequestException('No organization associated');
    }
    return { userId: user.sub, orgId: user.orgId, role: user.role };
  }
}
