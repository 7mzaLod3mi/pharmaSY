import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ReportExportStatus } from '@prisma/client';
import { UserRole } from '@pharmasyn/types';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { ReportFiltersDto } from './dto/reports.dto';
import { ReportRendererService } from './report-renderer.service';
import { REPORT_EXPORT_QUEUE } from './report-exports.service';
import { ReportsService } from './reports.service';

@Processor(REPORT_EXPORT_QUEUE)
export class ReportExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportExportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly renderer: ReportRendererService,
    private readonly upload: UploadService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ exportId: string }>) {
    const record = await this.prisma.reportExport.findUnique({
      where: { id: job.data.exportId },
    });
    if (!record)
      throw new Error(`Report export ${job.data.exportId} not found`);
    if (record.status === ReportExportStatus.COMPLETED) return record;

    await this.prisma.reportExport.update({
      where: { id: record.id },
      data: {
        status: ReportExportStatus.PROCESSING,
        progress: 5,
        attempts: { increment: 1 },
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    try {
      const filters = record.filters as unknown as ReportFiltersDto;
      const result = await this.reports.generate(
        record.reportType,
        {
          orgId: record.orgId,
          role: record.orgRole as UserRole,
        },
        filters,
      );
      const hardLimit = Number(
        this.config.get(
          record.format === 'PDF'
            ? 'REPORT_ASYNC_PDF_ROW_LIMIT'
            : 'REPORT_ASYNC_ROW_LIMIT',
          record.format === 'PDF' ? '5000' : '100000',
        ),
      );
      if (result.rows.length > hardLimit) {
        throw new Error(
          `Report contains ${result.rows.length} rows; maximum is ${hardLimit}`,
        );
      }
      await job.updateProgress(50);
      await this.prisma.reportExport.update({
        where: { id: record.id },
        data: { progress: 50, rowCount: result.rows.length },
      });

      const file = await this.renderer.render(
        result,
        record.format,
        record.locale,
      );
      const fileName = `${record.reportType.toLowerCase()}_${record.id}.${file.extension}`;
      const storageKey = `private/reports/${record.orgId}/${record.id}/${fileName}`;
      await this.upload.uploadPrivateBuffer(
        file.buffer,
        storageKey,
        file.contentType,
        fileName,
      );
      await job.updateProgress(95);

      const retentionHours = Number(
        this.config.get('REPORT_EXPORT_RETENTION_HOURS', '24'),
      );
      const expiresAt = new Date(
        Date.now() + Math.max(retentionHours, 1) * 60 * 60 * 1000,
      );
      const completed = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.reportExport.update({
          where: { id: record.id },
          data: {
            status: ReportExportStatus.COMPLETED,
            progress: 100,
            rowCount: result.rows.length,
            storageKey,
            fileName,
            contentType: file.contentType,
            completedAt: new Date(),
            expiresAt,
            errorMessage: null,
          },
        });
        await tx.auditLog.create({
          data: {
            entityType: 'ReportExport',
            entityId: record.id,
            action: 'COMPLETED',
            userId: record.requestedByUserId,
            orgId: record.orgId,
            userRole: record.orgRole,
            newValues: {
              reportType: record.reportType,
              format: record.format,
              rowCount: result.rows.length,
              storageKey,
              expiresAt: expiresAt.toISOString(),
            },
          },
        });
        return updated;
      });
      return completed;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Unknown export error';
      const attempts = job.opts.attempts ?? 1;
      const willRetry = job.attemptsMade + 1 < attempts;
      await this.prisma.reportExport.update({
        where: { id: record.id },
        data: {
          status: willRetry
            ? ReportExportStatus.QUEUED
            : ReportExportStatus.FAILED,
          progress: 0,
          errorMessage: message,
        },
      });
      this.logger.error(`Report export ${record.id} failed: ${message}`);
      throw error;
    }
  }
}
