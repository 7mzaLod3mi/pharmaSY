import {
  ReportExportFormat,
  ReportExportStatus,
  ReportLocale,
  ReportType,
  UserRole,
} from '@prisma/client';
import { ReportExportProcessor } from './report-export.processor';

describe('ReportExportProcessor', () => {
  const record = {
    id: 'export-1',
    requestedByUserId: 'user-1',
    orgId: 'pharmacy-1',
    orgRole: UserRole.PHARMACY,
    reportType: ReportType.PHARMACY_POS_SALES,
    format: ReportExportFormat.XLSX,
    locale: ReportLocale.EN,
    filters: {},
    status: ReportExportStatus.QUEUED,
  };
  let prisma: any;
  let reports: any;
  let renderer: any;
  let upload: any;
  let config: any;
  let processor: ReportExportProcessor;
  let job: any;

  beforeEach(() => {
    const transactionClient = {
      reportExport: {
        update: jest.fn().mockImplementation(({ data }: any) => ({
          ...record,
          ...data,
        })),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma = {
      reportExport: {
        findUnique: jest.fn().mockResolvedValue(record),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((callback: any) => callback(transactionClient)),
    };
    reports = {
      generate: jest.fn().mockResolvedValue({
        reportType: record.reportType,
        titleAr: 'مبيعات الصيدلية',
        titleEn: 'Pharmacy sales',
        generatedAt: new Date(),
        columns: [],
        rows: [{ total: 10 }],
        summary: { netSales: 10 },
      }),
    };
    renderer = {
      render: jest.fn().mockResolvedValue({
        buffer: Buffer.from('PK-test'),
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
      }),
    };
    upload = { uploadPrivateBuffer: jest.fn().mockResolvedValue(undefined) };
    config = { get: jest.fn((_key: string, fallback: string) => fallback) };
    processor = new ReportExportProcessor(
      prisma,
      reports,
      renderer,
      upload,
      config,
    );
    job = {
      data: { exportId: record.id },
      opts: { attempts: 3 },
      attemptsMade: 0,
      updateProgress: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('renders, privately uploads, and audits an organization-scoped export', async () => {
    const completed = await processor.process(job);

    expect(reports.generate).toHaveBeenCalledWith(
      record.reportType,
      { orgId: record.orgId, role: record.orgRole },
      {},
    );
    expect(upload.uploadPrivateBuffer).toHaveBeenCalledWith(
      expect.any(Buffer),
      `private/reports/${record.orgId}/${record.id}/pharmacy_pos_sales_${record.id}.xlsx`,
      expect.stringContaining('spreadsheetml'),
      `pharmacy_pos_sales_${record.id}.xlsx`,
    );
    expect(completed.status).toBe(ReportExportStatus.COMPLETED);
    expect(completed.progress).toBe(100);
  });

  it('returns the database state to queued when BullMQ will retry', async () => {
    renderer.render.mockRejectedValue(new Error('temporary renderer failure'));

    await expect(processor.process(job)).rejects.toThrow(
      'temporary renderer failure',
    );
    expect(prisma.reportExport.update).toHaveBeenLastCalledWith({
      where: { id: record.id },
      data: expect.objectContaining({
        status: ReportExportStatus.QUEUED,
        progress: 0,
      }),
    });
  });
});
