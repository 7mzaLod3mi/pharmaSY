import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryBatchDto, AdjustStockDto } from './dto/inventory.dto';
import { MovementType, Prisma } from '@prisma/client';

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
    const batches = await this.prisma.inventory.findMany({
      where: { pharmacyId, deletedAt: null }
    });

    let totalValue = 0;
    let available = 0;
    let reserved = 0;
    let expiredCount = 0;
    let nearExpiryCount = 0;

    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(now.getDate() + 90);

    batches.forEach(b => {
      totalValue += Number(b.purchaseCost) * b.quantity;
      available += (b.quantity - b.reservedStock);
      reserved += b.reservedStock;
      
      if (b.expiryDate < now) expiredCount++;
      else if (b.expiryDate <= ninetyDays) nearExpiryCount++;
    });

    return {
      totalBatches: batches.length,
      totalValue,
      available,
      reserved,
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

  // ─── HELPER ──────────────────────────────────────────────────────────────────

  private async logMovement(tx: Prisma.TransactionClient, data: any) {
    return tx.inventoryMovement.create({ data });
  }
}
