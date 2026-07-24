import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryBatchDto, AdjustStockDto } from './dto/inventory.dto';
import { CommitInventoryImportDto, ImportConflictStrategy } from './dto/import.dto';
import { MovementType, Prisma, ProductStatus } from '@prisma/client';
import { createHash } from 'crypto';

export interface FefoAllocation {
  inventoryId: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  unitCost: Prisma.Decimal;
}

export interface InventoryMovementReference {
  type: MovementType;
  referenceId?: string;
  orderId?: string;
  marketplaceOfferId?: string;
  saleId?: string;
  saleReturnId?: string;
  reason?: string;
}

export interface InventoryImportResult {
  totalRows: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: Array<{ rowId: string; message: string }>;
}

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService
  ) {}

  // ─── BATCH CRUD ─────────────────────────────────────────────────────────────

  async findAllBatches(pharmacyId: string, search?: string, page = 1, limit = 20) {
    page = Math.max(1, Math.trunc(page) || 1);
    limit = Math.min(100, Math.max(1, Math.trunc(limit) || 20));
    const skip = (page - 1) * limit;
    const where: Prisma.InventoryWhereInput = { pharmacyId, deletedAt: null };

    if (search) {
      where.OR = [
        { product: { tradeNameAr: { contains: search, mode: 'insensitive' } } },
        { product: { tradeNameEn: { contains: search, mode: 'insensitive' } } },
        { product: { barcode: { contains: search, mode: 'insensitive' } } },
        { batchNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: { product: true },
        skip,
        take: limit,
        orderBy: { expiryDate: 'asc' }
      }),
      this.prisma.inventory.count({ where })
    ]);

    return {
      data,
      meta: {
        total, page, limit, totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1
      }
    };
  }

  async getBatchMovements(pharmacyId: string, batchId: string, page = 1, limit = 20) {
    const batch = await this.prisma.inventory.findUnique({ where: { id: batchId } });
    if (!batch || batch.pharmacyId !== pharmacyId) throw new NotFoundException('Batch not found');

    page = Math.max(1, Math.trunc(page) || 1);
    limit = Math.min(100, Math.max(1, Math.trunc(limit) || 20));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where: { inventoryId: batchId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit
      }),
      this.prisma.inventoryMovement.count({ where: { inventoryId: batchId } })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1 }
    };
  }

  async getGlobalMovements(pharmacyId: string, page = 1, limit = 20) {
    page = Math.max(1, Math.trunc(page) || 1);
    limit = Math.min(100, Math.max(1, Math.trunc(limit) || 20));
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where: { pharmacyId },
        include: { 
          user: { select: { id: true, firstName: true, lastName: true } },
          inventory: { include: { product: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit
      }),
      this.prisma.inventoryMovement.count({ where: { pharmacyId } })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1 }
    };
  }

  async createBatch(pharmacyId: string, userId: string, dto: CreateInventoryBatchDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findUnique({
        where: { pharmacyId_productId_batchNumber: { pharmacyId, productId: dto.productId, batchNumber: dto.batchNumber } }
      });
      if (existing && !existing.deletedAt) {
        throw new BadRequestException('Batch number already exists for this product');
      }

      const data = {
        expiryDate: new Date(dto.expiryDate),
        purchaseCost: dto.purchaseCost,
        sellingPrice: dto.sellingPrice,
        supplierId: dto.supplierId,
        supplierName: dto.supplierName,
        quantity: dto.quantity,
        reservedStock: 0,
        minStock: dto.minStock ?? 0,
        location: dto.location,
        notes: dto.notes,
        deletedAt: null,
        deletedBy: null,
      };
      const batch = existing
        ? await tx.inventory.update({
            where: { id: existing.id },
            data,
            include: { product: true },
          })
        : await tx.inventory.create({
            data: {
              pharmacyId,
              productId: dto.productId,
              batchNumber: dto.batchNumber,
              ...data,
            },
            include: { product: true },
          });

      await this.logMovement(tx, {
        inventoryId: batch.id,
        productId: batch.productId,
        pharmacyId,
        batchNumber: batch.batchNumber,
        type: 'MANUAL_ADJUSTMENT',
        quantity: dto.quantity,
        prevQuantity: 0,
        newQuantity: dto.quantity,
        difference: dto.quantity,
        userId,
        reason: 'Initial batch creation'
      });

      return batch;
    });
  }

  async adjustBatch(pharmacyId: string, batchId: string, userId: string, dto: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const batches: any[] = await tx.$queryRaw`SELECT * FROM "inventory" WHERE id = ${batchId} FOR UPDATE`;
      const batch = batches[0];
      if (!batch || batch.pharmacyId !== pharmacyId || batch.deletedAt) throw new NotFoundException('Batch not found');
      if (
        (dto.type === MovementType.DAMAGED || dto.type === MovementType.EXPIRED) &&
        dto.quantity > 0
      ) {
        throw new BadRequestException(`${dto.type} adjustments must reduce stock`);
      }

      const newQuantity = batch.quantity + dto.quantity;
      if (newQuantity < batch.reservedStock) {
        throw new BadRequestException('Quantity cannot be less than reserved stock');
      }

      const updated = await tx.inventory.update({
        where: { id: batchId },
        data: { quantity: newQuantity }
      });

      if (dto.quantity !== 0) {
        await this.logMovement(tx, {
          inventoryId: batch.id,
          productId: batch.productId,
          pharmacyId,
          batchNumber: batch.batchNumber,
          type: dto.type,
          quantity: Math.abs(dto.quantity),
          prevQuantity: batch.quantity,
          newQuantity,
          difference: dto.quantity,
          userId,
          reason: dto.reason,
          notes: dto.notes
        });
      }

      return updated;
    });
  }

  async deleteBatch(pharmacyId: string, batchId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.inventory.findUnique({ where: { id: batchId } });
      if (!batch || batch.pharmacyId !== pharmacyId || batch.deletedAt) throw new NotFoundException('Batch not found');
      if (batch.reservedStock > 0) throw new BadRequestException('Cannot delete batch with reserved stock');

      const deleted = await tx.inventory.update({
        where: { id: batchId },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          quantity: 0
        }
      });

      if (batch.quantity > 0) {
        await this.logMovement(tx, {
          inventoryId: batch.id,
          productId: batch.productId,
          pharmacyId,
          batchNumber: batch.batchNumber,
          type: 'ADMIN_CORRECTION',
          quantity: batch.quantity,
          prevQuantity: batch.quantity,
          newQuantity: 0,
          difference: -batch.quantity,
          userId,
          reason: 'Batch soft deleted'
        });
      }
      return deleted;
    });
  }

  // ─── FEFO ALLOCATION ENGINE ──────────────────────────────────────────────────

  async allocateFEFO(
    tx: Prisma.TransactionClient,
    pharmacyId: string,
    productId: string,
    requiredQuantity: number,
    userId: string,
    reference: InventoryMovementReference,
  ): Promise<FefoAllocation[]> {
    if (!Number.isInteger(requiredQuantity) || requiredQuantity <= 0) {
      throw new BadRequestException('Required quantity must be a positive integer');
    }

    const batches: any[] = await tx.$queryRaw`
      SELECT * FROM "inventory"
      WHERE "pharmacyId" = ${pharmacyId}
        AND "productId" = ${productId}
        AND "deletedAt" IS NULL
        AND "quantity" > 0
        AND "expiryDate" > NOW()
      ORDER BY "expiryDate" ASC
      FOR UPDATE
    `;

    let remaining = requiredQuantity;
    const allocations: FefoAllocation[] = [];
    for (const batch of batches) {
      if (remaining <= 0) break;
      const availableInBatch = batch.quantity - batch.reservedStock;
      if (availableInBatch <= 0) continue;

      const deductAmount = Math.min(availableInBatch, remaining);
      remaining -= deductAmount;

      await tx.inventory.update({
        where: { id: batch.id },
        data: { quantity: { decrement: deductAmount } }
      });

      await this.logMovement(tx, {
        inventoryId: batch.id,
        productId: batch.productId,
        pharmacyId,
        batchNumber: batch.batchNumber,
        type: reference.type,
        quantity: deductAmount,
        prevQuantity: batch.quantity,
        newQuantity: batch.quantity - deductAmount,
        difference: -deductAmount,
        userId,
        referenceId: reference.referenceId,
        orderId: reference.orderId,
        marketplaceOfferId: reference.marketplaceOfferId,
        saleId: reference.saleId,
        saleReturnId: reference.saleReturnId,
        reason: reference.reason,
      });

      allocations.push({
        inventoryId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: deductAmount,
        unitCost: new Prisma.Decimal(batch.purchaseCost),
      });
    }

    if (remaining > 0) {
      throw new BadRequestException('Insufficient available stock across all batches');
    }

    return allocations;
  }

  // ─── ALERTS & DASHBOARDS ────────────────────────────────────────────────────

  async getDashboardMetrics(pharmacyId: string) {
    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(now.getDate() + 90);

    const [aggregations, expiredCount, nearExpiryCount] = await Promise.all([
      this.prisma.$queryRaw<{totalBatches: bigint, totalQuantity: bigint, totalReserved: bigint, totalValue: number}[]>`
        SELECT 
          COUNT(*) as "totalBatches",
          SUM(quantity) as "totalQuantity",
          SUM("reservedStock") as "totalReserved",
          SUM(quantity * "purchaseCost") as "totalValue"
        FROM inventory
        WHERE "pharmacyId" = ${pharmacyId} AND "deletedAt" IS NULL
      `,
      this.prisma.inventory.count({
        where: { pharmacyId, deletedAt: null, expiryDate: { lt: now } }
      }),
      this.prisma.inventory.count({
        where: { pharmacyId, deletedAt: null, expiryDate: { gte: now, lte: ninetyDays } }
      })
    ]);

    const agg = aggregations[0] || { totalBatches: 0n, totalQuantity: 0n, totalReserved: 0n, totalValue: 0 };

    return {
      totalBatches: Number(agg.totalBatches || 0),
      totalValue: Number(agg.totalValue || 0),
      available: Number(agg.totalQuantity || 0) - Number(agg.totalReserved || 0),
      reserved: Number(agg.totalReserved || 0),
      expiredCount,
      nearExpiryCount
    };
  }

  async getLowStockAlerts(pharmacyId: string) {
    const products = await this.prisma.product.findMany({
      where: { inventory: { some: { pharmacyId, deletedAt: null } } },
      include: {
        inventory: { where: { pharmacyId, deletedAt: null } }
      }
    });

    const alerts = [];
    for (const p of products) {
      const totalAvailable = p.inventory.reduce((sum, b) => sum + (b.quantity - b.reservedStock), 0);
      const minStock = p.inventory.reduce((max, batch) => Math.max(max, batch.minStock), 0);
      if (totalAvailable <= minStock) {
        alerts.push({
          productId: p.id,
          productName: p.tradeNameEn,
          totalAvailable,
          minStock
        });
      }
    }
    return alerts;
  }

  async getExpiryAlerts(pharmacyId: string, days = 90) {
    days = Math.min(3650, Math.max(0, Math.trunc(days) || 90));
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    return this.prisma.inventory.findMany({
      where: {
        pharmacyId,
        deletedAt: null,
        quantity: { gt: 0 },
        expiryDate: { lte: threshold }
      },
      include: { product: true },
      orderBy: { expiryDate: 'asc' }
    });
  }

  async commitImport(pharmacyId: string, userId: string, dto: CommitInventoryImportDto) {
    const requestHash = createHash('sha256')
      .update(JSON.stringify(dto))
      .digest('hex');

    try {
      return await this.prisma.$transaction(async (tx) => {
      const replay = await tx.inventoryImportMutation.findUnique({
        where: {
          pharmacyId_clientMutationId: {
            pharmacyId,
            clientMutationId: dto.clientMutationId,
          },
        },
      });
      if (replay) {
        if (replay.requestHash !== requestHash) {
          throw new ConflictException(
            'clientMutationId was already used with a different inventory import',
          );
        }
        return replay.result as unknown as InventoryImportResult;
      }
      await tx.inventoryImportMutation.create({
        data: {
          pharmacyId,
          userId,
          clientMutationId: dto.clientMutationId,
          requestHash,
          result: { status: 'PROCESSING' },
        },
      });

      // Idempotency check: if clientMutationId was already used for an import recently
      if (dto.importId) {
        const existingImport = await tx.productImport.findFirst({
          where: { pharmacyId, id: dto.importId, status: 'COMPLETED' }
        });
        if (existingImport) {
          throw new BadRequestException('This import has already been completed.');
        }
      }
      
      const results: InventoryImportResult = {
        totalRows: dto.rows.length,
        createdRows: 0,
        updatedRows: 0,
        skippedRows: 0,
        failedRows: 0,
        errors: [] as { rowId: string, message: string }[]
      };

      for (const row of dto.rows) {
        try {
          // Validate product
          const product = await tx.product.findUnique({ where: { id: row.productId } });
          if (!product) {
            results.failedRows++;
            results.errors.push({ rowId: row.rowId, message: 'Product not found in Master Catalog' });
            continue;
          }
          if (product.status !== ProductStatus.ACTIVE) {
            results.failedRows++;
            results.errors.push({ rowId: row.rowId, message: 'Product is inactive' });
            continue;
          }

          const batchNumber = row.batchNumber.trim();

          const existingBatch = await tx.inventory.findUnique({
            where: { pharmacyId_productId_batchNumber: { pharmacyId, productId: row.productId, batchNumber } }
          });

          if (existingBatch) {
            if (dto.conflictStrategy === ImportConflictStrategy.SKIP) {
              results.skippedRows++;
              continue;
            }
            // Update Strategy
            const prevQuantity = existingBatch.quantity;
            const newQuantity = row.quantity;
            const difference = newQuantity - prevQuantity;

            await tx.inventory.update({
              where: { id: existingBatch.id },
              data: {
                quantity: newQuantity,
                purchaseCost: row.purchaseCost,
                sellingPrice: row.sellingPrice ?? existingBatch.sellingPrice,
                expiryDate: new Date(row.expiryDate),
                minStock: row.minStock ?? existingBatch.minStock,
                location: row.location ?? existingBatch.location,
                supplierReference: row.supplierReference ?? existingBatch.supplierReference,
                supplierName: row.supplierName ?? existingBatch.supplierName,
              }
            });

            if (difference !== 0) {
              await tx.inventoryMovement.create({
                data: {
                  inventoryId: existingBatch.id,
                  productId: row.productId,
                  pharmacyId,
                  batchNumber,
                  type: MovementType.MANUAL_ADJUSTMENT,
                  quantity: Math.abs(difference),
                  prevQuantity,
                  newQuantity,
                  difference,
                  reason: 'Inventory Import Update',
                  userId,
                }
              });
            }
            results.updatedRows++;
          } else {
            // Create Batch
            const newBatch = await tx.inventory.create({
              data: {
                pharmacyId,
                productId: row.productId,
                batchNumber,
                expiryDate: new Date(row.expiryDate),
                purchaseCost: row.purchaseCost,
                sellingPrice: row.sellingPrice,
                quantity: row.quantity,
                minStock: row.minStock ?? 0,
                location: row.location,
                supplierReference: row.supplierReference,
                supplierName: row.supplierName,
              }
            });

            if (row.quantity > 0) {
              await tx.inventoryMovement.create({
                data: {
                  inventoryId: newBatch.id,
                  productId: row.productId,
                  pharmacyId,
                  batchNumber,
                  type: MovementType.MANUAL_ADJUSTMENT,
                  quantity: row.quantity,
                  prevQuantity: 0,
                  newQuantity: row.quantity,
                  difference: row.quantity,
                  reason: 'Initial Inventory Import',
                  userId,
                }
              });
            }
            results.createdRows++;
          }
        } catch (error: unknown) {
          results.failedRows++;
          results.errors.push({
            rowId: row.rowId,
            message:
              error instanceof Error
                ? error.message
                : 'Unknown error during commit',
          });
        }
      }

      if (dto.importId) {
        await tx.productImport.update({
          where: { id: dto.importId },
          data: {
            status: 'COMPLETED',
            createdRows: results.createdRows,
            updatedRows: results.updatedRows,
            skippedRows: results.skippedRows,
            failedRows: results.failedRows,
            errors: results.errors as Prisma.InputJsonValue,
            processedAt: new Date()
          }
        });
      }

      await tx.inventoryImportMutation.update({
        where: {
          pharmacyId_clientMutationId: {
            pharmacyId,
            clientMutationId: dto.clientMutationId,
          },
        },
        data: { result: results as unknown as Prisma.InputJsonValue },
      });

      return results;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const replay = await this.prisma.inventoryImportMutation.findUnique({
          where: {
            pharmacyId_clientMutationId: {
              pharmacyId,
              clientMutationId: dto.clientMutationId,
            },
          },
        });
        if (replay) {
          if (replay.requestHash !== requestHash) {
            throw new ConflictException(
              'clientMutationId was already used with a different inventory import',
            );
          }
          return replay.result as unknown as InventoryImportResult;
        }
      }
      throw error;
    }
  }

  // ─── ADJUST STOCK ──────────────────────────────────────────────────────────────────

  private async logMovement(tx: Prisma.TransactionClient, data: any) {
    return tx.inventoryMovement.create({ data });
  }
}
