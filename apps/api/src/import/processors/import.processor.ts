import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as xlsx from 'xlsx';
import { SupplierProductsService } from '../../products/supplier-products.service';
import { UploadService } from '../../upload/upload.service';

interface SupplierImportJob {
  importId: string;
  storageKey?: string;
  /** Compatibility for jobs queued before private object storage was introduced. */
  fileUrl?: string;
  supplierId: string;
}

type ImportRow = Record<string, unknown>;

function firstValue(row: ImportRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function cellString(value: unknown, fallback = ''): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return fallback;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

@Processor('product-import')
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private supplierProductsService: SupplierProductsService,
    private uploadService: UploadService,
  ) {
    super();
  }

  async process(job: Job<SupplierImportJob>) {
    this.logger.log(
      `Processing import job ${job.id} for import ${job.data.importId}`,
    );

    const { importId, storageKey, supplierId } = job.data;

    try {
      await this.prisma.productImport.update({
        where: { id: importId },
        data: { status: 'PROCESSING' },
      });

      // 1. Read the private object directly from R2. No public URL is exposed.
      const buffer = storageKey
        ? await this.uploadService.getPrivateBuffer(storageKey)
        : await this.readLegacyImport(job.data.fileUrl);

      // 2. Parse Excel
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<ImportRow>(sheet, {
        defval: '',
        raw: true,
      });

      const totalRows = rows.length;
      let createdRows = 0;
      let updatedRows = 0;
      let skippedRows = 0;
      let failedRows = 0;
      const errors: Array<{ row: number; message: string }> = [];

      await this.prisma.productImport.update({
        where: { id: importId },
        data: { totalRows },
      });

      // 3. Process rows
      // We expect columns: barcode (or id), price, stock, minOrder, expiryDate
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) throw new Error('Supplier not found');
      const requesterId = supplier.userId;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const barcode = cellString(
            firstValue(row, ['barcode', 'Barcode', 'الباركود']),
          ).trim();
          if (!barcode) {
            throw new Error('Barcode is required');
          }

          const product = await this.prisma.product.findFirst({
            where: { barcode },
          });

          if (!product) {
            // Auto-create Product Request for unknown product
            const brandName =
              cellString(
                firstValue(row, ['name', 'Name', 'tradeName', 'الاسم']),
              ).trim() || `Unknown (${barcode})`;
            const existingRequest = await this.prisma.productRequest.findFirst({
              where: {
                requesterId,
                barcode,
                status: 'PENDING',
              },
            });
            if (!existingRequest) {
              await this.prisma.productRequest.create({
                data: {
                  requesterId,
                  brandName,
                  barcode,
                  status: 'PENDING',
                },
              });
            }
            skippedRows++;
            errors.push({
              row: i + 2,
              message: 'Created Product Request (Pending Approval)',
            });
            continue;
          }

          const price = Number.parseFloat(
            cellString(firstValue(row, ['price', 'Price', 'السعر'])),
          );
          const stock = Number.parseInt(
            cellString(firstValue(row, ['stock', 'Stock', 'المخزون']), '0'),
            10,
          );
          const minOrder = Number.parseInt(
            cellString(
              firstValue(row, ['minOrder', 'Min Order', 'الحد الأدنى']),
              '1',
            ),
            10,
          );

          let expiryDate: string | undefined = undefined;
          const rawExpiry = firstValue(row, [
            'expiryDate',
            'Expiry Date',
            'تاريخ الصلاحية',
          ]);
          if (rawExpiry) {
            // Check if it's an Excel date number
            if (typeof rawExpiry === 'number') {
              const date = new Date((rawExpiry - (25567 + 2)) * 86400 * 1000); // Excel epoch conversion
              expiryDate = date.toISOString();
            } else {
              expiryDate = new Date(cellString(rawExpiry)).toISOString();
            }
          }

          if (isNaN(price) || price < 0) {
            throw new Error('Invalid price');
          }
          const batchNumber = cellString(
            firstValue(row, ['batchNumber', 'Batch Number', 'رقم التشغيلة']),
          ).trim();
          if (!batchNumber) {
            throw new Error('Batch number is required');
          }
          if (!expiryDate || new Date(expiryDate) <= new Date()) {
            throw new Error('A valid future expiry date is required');
          }

          // Check if supplier product already exists
          const existing = await this.prisma.supplierProduct.findUnique({
            where: {
              supplierId_productId: { supplierId, productId: product.id },
            },
          });

          await this.supplierProductsService.upsert(supplierId, {
            productId: product.id,
            price,
            stock: isNaN(stock) ? 0 : stock,
            minOrder: isNaN(minOrder) ? 1 : minOrder,
            expiryDate,
            batchNumber,
            isAvailable: true,
          });

          if (existing) {
            updatedRows++;
          } else {
            createdRows++;
          }
        } catch (error: unknown) {
          failedRows++;
          errors.push({ row: i + 2, message: errorMessage(error) }); // +2 for header and 1-index
        }
      }

      await this.prisma.productImport.update({
        where: { id: importId },
        data: {
          status: 'COMPLETED',
          createdRows,
          updatedRows,
          skippedRows,
          failedRows,
          errors: errors,
          processedAt: new Date(),
        },
      });
      if (storageKey) {
        await this.uploadService
          .deleteFile(storageKey)
          .catch((cleanupError: unknown) => {
            this.logger.warn(
              `Import ${importId} completed but its private source could not be deleted: ${errorMessage(cleanupError)}`,
            );
          });
      }
    } catch (error: unknown) {
      this.logger.error(`Import job ${job.id} failed:`, error);
      await this.prisma.productImport.update({
        where: { id: job.data.importId },
        data: {
          status: 'FAILED',
          errors: [
            {
              row: 0,
              message: errorMessage(error) || 'Fatal error processing file',
            },
          ],
        },
      });
      throw error;
    }
  }

  private async readLegacyImport(fileUrl?: string) {
    if (!fileUrl) throw new Error('Import file reference is missing');
    const response = await axios.get<ArrayBuffer>(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30_000,
    });
    return Buffer.from(response.data);
  }
}
