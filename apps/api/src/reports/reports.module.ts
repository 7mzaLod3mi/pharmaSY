import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UploadModule } from '../upload/upload.module';
import { ReportExportProcessor } from './report-export.processor';
import {
  REPORT_EXPORT_QUEUE,
  ReportExportsService,
} from './report-exports.service';
import { ReportRendererService } from './report-renderer.service';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: REPORT_EXPORT_QUEUE }),
    UploadModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportRendererService,
    ReportExportsService,
    ReportExportProcessor,
  ],
  exports: [ReportsService, ReportExportsService],
})
export class ReportsModule {}
