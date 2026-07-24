import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ImportService {
  constructor(
    @InjectQueue('product-import') private importQueue: Queue,
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async queueImport(file: Express.Multer.File, supplierId: string) {
    const { key, url } = await this.uploadService.uploadFile(file, 'imports');

    const importRecord = await this.prisma.productImport.create({
      data: {
        supplierId,
        fileName: file.originalname,
        fileUrl: url,
        status: 'QUEUED',
      },
    });

    await this.importQueue.add(
      'process-import',
      { importId: importRecord.id, fileUrl: url, supplierId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );

    return importRecord;
  }
}
