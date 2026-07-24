import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as xlsx from 'xlsx';
import { SupplierProductsService } from '../../products/supplier-products.service';

@Processor('product-import')
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private supplierProductsService: SupplierProductsService,
  ) {
    super();
  }

  async process(job: Job<{ importId: string; fileUrl: string; supplierId: string }>) {
    this.logger.log(`Processing import job ${job.id} for import ${job.data.importId}`);

    const { importId, fileUrl, supplierId } = job.data;

    try {
      await this.prisma.productImport.update({
        where: { id: importId },
        data: { status: 'PROCESSING' },
      });

      // 1. Download file from R2
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      // 2. Parse Excel
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet) as any[];

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
      const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) throw new Error('Supplier not found');
      const requesterId = supplier.userId;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const barcode = row.barcode || row.Barcode || row['الباركود'];
          if (!barcode) {
            throw new Error('Barcode is required');
          }

          const product = await this.prisma.product.findFirst({
            where: { barcode: String(barcode) },
          });

          if (!product) {
            // Auto-create Product Request for unknown product
            const brandName = row.name || row.Name || row.tradeName || row['الاسم'] || `Unknown (${barcode})`;
            const existingRequest = await this.prisma.productRequest.findFirst({
              where: {
                requesterId,
                barcode: String(barcode),
                status: 'PENDING',
              },
            });
            if (!existingRequest) {
              await this.prisma.productRequest.create({
                data: {
                  requesterId,
                  brandName: String(brandName),
                  barcode: String(barcode),
                  status: 'PENDING',
                },
              });
            }
            skippedRows++;
            errors.push({ row: i + 2, message: 'Created Product Request (Pending Approval)' });
            continue;
          }

          const price = parseFloat(row.price || row.Price || row['السعر']);
          const stock = parseInt(row.stock || row.Stock || row['المخزون'] || '0', 10);
          const minOrder = parseInt(row.minOrder || row['Min Order'] || row['الحد الأدنى'] || '1', 10);
          
          let expiryDate: string | undefined = undefined;
          const rawExpiry = row.expiryDate || row['Expiry Date'] || row['تاريخ الصلاحية'];
          if (rawExpiry) {
            // Check if it's an Excel date number
            if (typeof rawExpiry === 'number') {
               const date = new Date((rawExpiry - (25567 + 2)) * 86400 * 1000); // Excel epoch conversion
               expiryDate = date.toISOString();
            } else {
               expiryDate = new Date(rawExpiry).toISOString();
            }
          }

          if (isNaN(price) || price < 0) {
            throw new Error('Invalid price');
          }

          // Check if supplier product already exists
          const existing = await this.prisma.supplierProduct.findUnique({
             where: { supplierId_productId: { supplierId, productId: product.id } }
          });

          await this.supplierProductsService.upsert(supplierId, {
            productId: product.id,
            price,
            stock: isNaN(stock) ? 0 : stock,
            minOrder: isNaN(minOrder) ? 1 : minOrder,
            expiryDate,
            isAvailable: true,
          });

          if (existing) {
            updatedRows++;
          } else {
            createdRows++;
          }

        } catch (err: any) {
          failedRows++;
          errors.push({ row: i + 2, message: err.message || 'Unknown error' }); // +2 for header and 1-index
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
          errors: errors as any,
          processedAt: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error(`Import job ${job.id} failed:`, error);
      await this.prisma.productImport.update({
        where: { id: job.data.importId },
        data: { 
          status: 'FAILED',
          errors: [{ row: 0, message: error.message || 'Fatal error processing file' }] as any
        },
      });
      throw error;
    }
  }
}
