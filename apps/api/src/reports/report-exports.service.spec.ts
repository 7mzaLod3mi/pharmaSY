import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ReportExportFormat,
  ReportExportStatus,
  ReportLocale,
  ReportType,
} from '@prisma/client';
import { UserRole } from '@pharmasyn/types';
import { ReportExportsService } from './report-exports.service';

describe('ReportExportsService', () => {
  const context = {
    userId: 'user-1',
    orgId: 'pharmacy-1',
    role: UserRole.PHARMACY,
  };
  const dto = {
    reportType: ReportType.PHARMACY_POS_SALES,
    format: ReportExportFormat.XLSX,
    locale: ReportLocale.AR,
    filters: { from: '2026-07-01' },
    clientRequestId: 'request-0001',
  };
  let prisma: any;
  let reports: any;
  let renderer: any;
  let upload: any;
  let config: any;
  let queue: any;
  let service: ReportExportsService;

  beforeEach(() => {
    prisma = {
      reportExport: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    reports = {
      assertAccess: jest.fn(),
      generate: jest.fn(),
    };
    renderer = { render: jest.fn() };
    upload = { getPrivateDownloadUrl: jest.fn() };
    config = { get: jest.fn((_key: string, fallback: string) => fallback) };
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'export-1' }),
      getJob: jest.fn().mockResolvedValue(null),
    };
    service = new ReportExportsService(
      prisma,
      reports,
      renderer,
      upload,
      config,
      queue,
    );
  });

  it('queues one idempotent export and replays the same client request', async () => {
    prisma.reportExport.create.mockImplementation(({ data }: any) => ({
      id: 'export-1',
      status: ReportExportStatus.QUEUED,
      ...data,
    }));

    const first = await service.create(context, dto);
    const requestHash =
      prisma.reportExport.create.mock.calls[0][0].data.requestHash;
    prisma.reportExport.findUnique.mockResolvedValue({
      ...first,
      requestHash,
    });
    const replay = await service.create(context, dto);

    expect(replay.id).toBe('export-1');
    expect(prisma.reportExport.create).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith(
      'generate',
      { exportId: 'export-1' },
      expect.objectContaining({ attempts: 3, jobId: 'export-1' }),
    );
  });

  it('rejects a reused client request ID with a different payload', async () => {
    prisma.reportExport.findUnique.mockResolvedValue({
      id: 'export-1',
      requestHash: 'different-hash',
    });

    await expect(service.create(context, dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('marks the database record failed when BullMQ is unavailable', async () => {
    prisma.reportExport.create.mockImplementation(({ data }: any) => ({
      id: 'export-1',
      ...data,
    }));
    queue.add.mockRejectedValue(new Error('redis unavailable'));

    await expect(service.create(context, dto)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(prisma.reportExport.update).toHaveBeenCalledWith({
      where: { id: 'export-1' },
      data: expect.objectContaining({ status: ReportExportStatus.FAILED }),
    });
  });

  it('does not reveal an export owned by another organization', async () => {
    prisma.reportExport.findFirst.mockResolvedValue(null);

    await expect(service.download(context, 'export-other')).rejects.toThrow(
      NotFoundException,
    );
    expect(upload.getPrivateDownloadUrl).not.toHaveBeenCalled();
    expect(prisma.reportExport.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'export-other',
        requestedByUserId: context.userId,
        orgId: context.orgId,
        orgRole: context.role,
      },
    });
  });

  it('requeues only failed exports and removes the old BullMQ job', async () => {
    const failed = {
      id: 'export-1',
      status: ReportExportStatus.FAILED,
      orgId: context.orgId,
    };
    const oldJob = { remove: jest.fn().mockResolvedValue(undefined) };
    prisma.reportExport.findFirst
      .mockResolvedValueOnce(failed)
      .mockResolvedValueOnce({ ...failed, status: ReportExportStatus.QUEUED });
    queue.getJob.mockResolvedValue(oldJob);

    const result = await service.retry(context, 'export-1');

    expect(oldJob.remove).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      'generate',
      { exportId: 'export-1' },
      expect.objectContaining({ attempts: 3 }),
    );
    expect(result.status).toBe(ReportExportStatus.QUEUED);
  });
});
