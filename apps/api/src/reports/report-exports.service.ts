import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  ReportExport,
  ReportExportFormat,
  ReportLocale,
  ReportExportStatus,
  ReportType,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import { UserRole } from '@pharmasyn/types';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import {
  CreateReportExportDto,
  ExportListQueryDto,
  ReportFiltersDto,
} from './dto/reports.dto';
import { ReportRendererService } from './report-renderer.service';
import { ReportsService } from './reports.service';

export const REPORT_EXPORT_QUEUE = 'report-export';

type ExportContext = {
  userId: string;
  orgId: string;
  role: UserRole;
};

@Injectable()
export class ReportExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly renderer: ReportRendererService,
    private readonly upload: UploadService,
    private readonly config: ConfigService,
    @InjectQueue(REPORT_EXPORT_QUEUE) private readonly queue: Queue,
  ) {}

  async direct(
    reportType: ReportType,
    context: ExportContext,
    filters: ReportFiltersDto,
    format: ReportExportFormat,
    locale: ReportLocale,
  ) {
    const result = await this.reports.generate(reportType, context, filters);
    const maxRows = Number(
      this.config.get(
        format === ReportExportFormat.PDF
          ? 'REPORT_SYNC_PDF_ROW_LIMIT'
          : 'REPORT_SYNC_ROW_LIMIT',
        format === ReportExportFormat.PDF ? '1000' : '5000',
      ),
    );
    if (result.rows.length > maxRows) {
      throw new PayloadTooLargeException({
        message: 'This export is too large for synchronous generation',
        rowCount: result.rows.length,
        syncRowLimit: maxRows,
        asyncEndpoint: '/api/v1/reports/exports',
      });
    }
    return {
      file: await this.renderer.render(result, format, locale),
      fileName: this.fileName(reportType, format),
      rowCount: result.rows.length,
    };
  }

  async create(
    context: ExportContext,
    dto: CreateReportExportDto,
  ): Promise<ReportExport> {
    this.reports.assertAccess(dto.reportType, context.role, context.orgId);
    const normalized = {
      reportType: dto.reportType,
      format: dto.format,
      locale: dto.locale,
      filters: dto.filters ?? {},
    };
    const requestHash = this.hash(normalized);

    if (dto.clientRequestId) {
      const existing = await this.prisma.reportExport.findUnique({
        where: {
          requestedByUserId_clientRequestId: {
            requestedByUserId: context.userId,
            clientRequestId: dto.clientRequestId,
          },
        },
      });
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new ConflictException(
            'clientRequestId was already used with a different export request',
          );
        }
        return existing;
      }
    }

    let created;
    try {
      created = await this.prisma.reportExport.create({
        data: {
          requestedByUserId: context.userId,
          orgId: context.orgId,
          orgRole: context.role as PrismaUserRole,
          reportType: dto.reportType,
          format: dto.format,
          locale: dto.locale,
          filters: normalized.filters as Prisma.InputJsonValue,
          requestHash,
          clientRequestId: dto.clientRequestId,
        },
      });
    } catch (error) {
      if (dto.clientRequestId && this.isUnique(error)) {
        return this.create(context, dto);
      }
      throw error;
    }

    try {
      await this.enqueue(created.id);
    } catch {
      await this.prisma.reportExport.update({
        where: { id: created.id },
        data: {
          status: ReportExportStatus.FAILED,
          errorMessage: 'The export queue is temporarily unavailable',
        },
      });
      throw new ServiceUnavailableException(
        'The export queue is temporarily unavailable; retry this request later',
      );
    }
    await this.prisma.auditLog.create({
      data: {
        entityType: 'ReportExport',
        entityId: created.id,
        action: 'CREATE',
        userId: context.userId,
        orgId: context.orgId,
        userRole: context.role,
        newValues: {
          reportType: dto.reportType,
          format: dto.format,
          locale: dto.locale,
          clientRequestId: dto.clientRequestId,
        },
      },
    });
    return created;
  }

  async list(context: ExportContext, query: ExportListQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where = {
      requestedByUserId: context.userId,
      orgId: context.orgId,
      orgRole: context.role as PrismaUserRole,
    };
    const [data, total] = await Promise.all([
      this.prisma.reportExport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reportExport.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async get(context: ExportContext, id: string) {
    const item = await this.scoped(context, id);
    if (
      item.status === ReportExportStatus.COMPLETED &&
      item.expiresAt &&
      item.expiresAt <= new Date()
    ) {
      await this.prisma.reportExport.update({
        where: { id },
        data: { status: ReportExportStatus.EXPIRED },
      });
      return { ...item, status: ReportExportStatus.EXPIRED };
    }
    return item;
  }

  async download(context: ExportContext, id: string) {
    const item = await this.scoped(context, id);
    if (
      item.status === ReportExportStatus.EXPIRED ||
      (item.expiresAt && item.expiresAt <= new Date())
    ) {
      throw new GoneException('Export has expired');
    }
    if (
      item.status !== ReportExportStatus.COMPLETED ||
      !item.storageKey ||
      !item.fileName
    ) {
      throw new ConflictException('Export is not ready for download');
    }
    const ttl = Number(this.config.get('REPORT_SIGNED_URL_TTL_SECONDS', '900'));
    return {
      url: await this.upload.getPrivateDownloadUrl(
        item.storageKey,
        item.fileName,
        ttl,
      ),
      expiresIn: Math.min(Math.max(ttl, 60), 3600),
    };
  }

  async retry(context: ExportContext, id: string) {
    const item = await this.scoped(context, id);
    if (item.status !== ReportExportStatus.FAILED) {
      throw new ConflictException('Only failed exports can be retried');
    }
    await this.prisma.reportExport.update({
      where: { id },
      data: {
        status: ReportExportStatus.QUEUED,
        progress: 0,
        errorMessage: null,
      },
    });
    try {
      await this.enqueue(id, true);
    } catch {
      await this.prisma.reportExport.update({
        where: { id },
        data: {
          status: ReportExportStatus.FAILED,
          errorMessage: 'The export queue is temporarily unavailable',
        },
      });
      throw new ServiceUnavailableException(
        'The export queue is temporarily unavailable',
      );
    }
    return this.scoped(context, id);
  }

  private async scoped(context: ExportContext, id: string) {
    const item = await this.prisma.reportExport.findFirst({
      where: {
        id,
        requestedByUserId: context.userId,
        orgId: context.orgId,
        orgRole: context.role as PrismaUserRole,
      },
    });
    if (!item) throw new NotFoundException('Report export not found');
    if (item.orgId !== context.orgId) {
      throw new ForbiddenException('Access denied');
    }
    return item;
  }

  private hash(value: unknown) {
    return createHash('sha256').update(this.stable(value)).digest('hex');
  }

  private stable(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stable(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${JSON.stringify(key)}:${this.stable(item)}`)
        .join(',')}}`;
    }
    return JSON.stringify(value) ?? 'null';
  }

  private async enqueue(exportId: string, retry = false) {
    if (retry) {
      const oldJob = await this.queue.getJob(exportId);
      if (oldJob) await oldJob.remove();
    }
    return this.queue.add(
      'generate',
      { exportId },
      {
        jobId: exportId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  private fileName(reportType: ReportType, format: ReportExportFormat) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${reportType.toLowerCase()}_${timestamp}.${format.toLowerCase()}`;
  }

  private isUnique(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
