import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ImportService {
  private readonly publicImportSelect = {
    id: true,
    fileName: true,
    status: true,
    totalRows: true,
    createdRows: true,
    updatedRows: true,
    skippedRows: true,
    failedRows: true,
    errors: true,
    processedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  constructor(
    @InjectQueue('product-import') private importQueue: Queue,
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async queueImport(file: Express.Multer.File, supplierId: string) {
    const key = `imports/${supplierId}/${randomUUID()}.xlsx`;
    await this.uploadService.uploadPrivateBuffer(
      file.buffer,
      key,
      file.mimetype,
      file.originalname,
    );

    const importRecord = await this.prisma.productImport.create({
      data: {
        supplierId,
        fileName: file.originalname,
        storageKey: key,
        status: 'QUEUED',
      },
    });

    try {
      await this.importQueue.add(
        'process-import',
        { importId: importRecord.id, storageKey: key, supplierId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    } catch (error) {
      await Promise.allSettled([
        this.prisma.productImport.update({
          where: { id: importRecord.id },
          data: {
            status: 'FAILED',
            errors: [{ row: 0, message: 'Import queue is unavailable' }],
          },
        }),
        this.uploadService.deleteFile(key),
      ]);
      throw error;
    }

    return importRecord;
  }

  getHistory(supplierId: string) {
    return this.prisma.productImport.findMany({
      where: { supplierId },
      select: this.publicImportSelect,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getStatus(id: string, supplierId: string) {
    const record = await this.prisma.productImport.findFirst({
      where: { id, supplierId },
      select: this.publicImportSelect,
    });
    if (!record) {
      throw new NotFoundException('Import record not found');
    }
    return record;
  }
}
