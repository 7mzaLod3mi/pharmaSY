import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiscountType,
  MovementType,
  OrgStatus,
  Prisma,
  ProductStatus,
  SalePaymentMethod,
  SalePaymentStatus,
  SalePaymentType,
  SaleReturnType,
  SaleStatus,
  UserRole,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { generateOrderNumber } from '../common/utils/order-number.util';
import {
  CancelSaleDto,
  CreateSaleDto,
  CreateSaleReturnDto,
  PosPaymentDto,
  SaleQueryDto,
} from './dto/pos.dto';

interface ReturnMutationInput {
  type: SaleReturnType;
  reason: string;
  items?: Array<{ saleItemId: string; quantity: number }>;
  refunds: PosPaymentDto[];
  clientMutationId: string;
  deviceId: string;
  clientCreatedAt?: string;
}

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async createSale(pharmacyId: string, staffUserId: string, dto: CreateSaleDto) {
    const mutationHash = this.hashMutation({ type: 'SALE', ...dto });
    const existing = await this.findSaleByMutation(pharmacyId, dto.clientMutationId);
    if (existing) return this.assertIdempotent(existing, mutationHash);

    try {
      return await this.withSerializableRetry(async (tx) => {
        const replay = await this.findSaleByMutation(
          pharmacyId,
          dto.clientMutationId,
          tx,
        );
        if (replay) return this.assertIdempotent(replay, mutationHash);

        await this.assertPharmacyStaff(tx, pharmacyId, staffUserId);
        this.assertClientTimestamp(dto.clientCreatedAt);
        const prepared = await this.prepareSale(tx, pharmacyId, dto);
        const paymentPlan = this.prepareSalePayments(
          dto.payments ?? [],
          prepared.totalAmount,
        );

        const sale = await tx.sale.create({
          data: {
            saleNumber: await generateOrderNumber(tx, 'SAL'),
            pharmacyId,
            staffUserId,
            status: SaleStatus.COMPLETED,
            paymentStatus: this.salePaymentStatus(
              paymentPlan.paidAmount,
              prepared.totalAmount,
            ),
            subtotal: prepared.subtotal,
            discountType: dto.discount?.type,
            discountValue: dto.discount?.value,
            discountAmount: prepared.discountAmount,
            totalAmount: prepared.totalAmount,
            paidAmount: paymentPlan.paidAmount,
            tenderedAmount: paymentPlan.tenderedAmount,
            changeAmount: paymentPlan.changeAmount,
            customerName: dto.customerName?.trim() || null,
            customerPhone: dto.customerPhone?.trim() || null,
            notes: dto.notes?.trim() || null,
            clientMutationId: dto.clientMutationId,
            mutationHash,
            deviceId: dto.deviceId.trim(),
            clientCreatedAt: dto.clientCreatedAt
              ? new Date(dto.clientCreatedAt)
              : null,
          },
        });

        for (const line of prepared.items) {
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: line.product.id,
              productNameAr: line.product.tradeNameAr,
              productNameEn: line.product.tradeNameEn,
              barcodeSnapshot: line.product.barcode,
              quantity: line.dto.quantity,
              unitPrice: line.unitPrice,
              grossAmount: line.grossAmount,
              lineDiscountAmount: line.lineDiscountAmount,
              saleDiscountAmount: line.saleDiscountAmount,
              netAmount: line.netAmount,
              costAmount: 0,
            },
          });

          const allocations = await this.inventoryService.allocateFEFO(
            tx,
            pharmacyId,
            line.product.id,
            line.dto.quantity,
            staffUserId,
            {
              type: MovementType.POS_SALE,
              referenceId: saleItem.id,
              saleId: sale.id,
              reason: `POS sale ${sale.saleNumber}`,
            },
          );
          const costAmount = allocations.reduce(
            (sum, allocation) =>
              sum.plus(allocation.unitCost.mul(allocation.quantity)),
            new Prisma.Decimal(0),
          );

          await tx.saleStockAllocation.createMany({
            data: allocations.map((allocation) => ({
              saleItemId: saleItem.id,
              inventoryId: allocation.inventoryId,
              quantity: allocation.quantity,
              unitCost: allocation.unitCost,
            })),
          });
          await tx.saleItem.update({
            where: { id: saleItem.id },
            data: { costAmount: this.money(costAmount) },
          });
        }

        if (paymentPlan.payments.length) {
          await tx.salePayment.createMany({
            data: paymentPlan.payments.map((payment) => ({
              saleId: sale.id,
              type: SalePaymentType.PAYMENT,
              method: payment.method,
              amount: payment.amount,
              tenderedAmount: payment.tenderedAmount,
              changeAmount: payment.changeAmount,
              reference: payment.reference,
              receivedByUserId: staffUserId,
            })),
          });
        }

        await tx.auditLog.create({
          data: {
            entityType: 'Sale',
            entityId: sale.id,
            action: 'POS_SALE_CREATE',
            userId: staffUserId,
            orgId: pharmacyId,
            userRole: UserRole.PHARMACY,
            newValues: {
              saleNumber: sale.saleNumber,
              totalAmount: sale.totalAmount.toString(),
              paidAmount: sale.paidAmount.toString(),
              itemCount: prepared.items.length,
              clientMutationId: dto.clientMutationId,
              deviceId: dto.deviceId,
            },
          },
        });

        return this.getSaleDetailsTx(tx, pharmacyId, sale.id);
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const replay = await this.findSaleByMutation(
          pharmacyId,
          dto.clientMutationId,
        );
        if (replay) return this.assertIdempotent(replay, mutationHash);
      }
      throw error;
    }
  }

  async createReturn(
    pharmacyId: string,
    staffUserId: string,
    saleId: string,
    dto: CreateSaleReturnDto,
  ) {
    return this.processReturnMutation(pharmacyId, staffUserId, saleId, {
      type: SaleReturnType.RETURN,
      reason: dto.reason,
      items: dto.items,
      refunds: dto.refunds ?? [],
      clientMutationId: dto.clientMutationId,
      deviceId: dto.deviceId,
      clientCreatedAt: dto.clientCreatedAt,
    });
  }

  async cancelSale(
    pharmacyId: string,
    staffUserId: string,
    saleId: string,
    dto: CancelSaleDto,
  ) {
    return this.processReturnMutation(pharmacyId, staffUserId, saleId, {
      type: SaleReturnType.CANCELLATION,
      reason: dto.reason,
      refunds: dto.refunds ?? [],
      clientMutationId: dto.clientMutationId,
      deviceId: dto.deviceId,
      clientCreatedAt: dto.clientCreatedAt,
    });
  }

  async findSales(pharmacyId: string, query: SaleQueryDto) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to && from > to) {
      throw new BadRequestException('"from" must be before or equal to "to"');
    }

    const where: Prisma.SaleWhereInput = {
      pharmacyId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.staffUserId ? { staffUserId: query.staffUserId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          staffUser: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { items: true, returns: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
        hasPrevPage: query.page > 1,
      },
    };
  }

  async getSale(pharmacyId: string, saleId: string) {
    const sale = await this.getSaleDetailsTx(this.prisma, pharmacyId, saleId);
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  private async processReturnMutation(
    pharmacyId: string,
    staffUserId: string,
    saleId: string,
    input: ReturnMutationInput,
  ) {
    const mutationHash = this.hashMutation({ saleId, ...input });
    const existing = await this.findReturnByMutation(
      pharmacyId,
      input.clientMutationId,
    );
    if (existing) return this.assertIdempotent(existing, mutationHash);

    try {
      return await this.withSerializableRetry(async (tx) => {
        const replay = await this.findReturnByMutation(
          pharmacyId,
          input.clientMutationId,
          tx,
        );
        if (replay) return this.assertIdempotent(replay, mutationHash);

        await this.assertPharmacyStaff(tx, pharmacyId, staffUserId);
        this.assertClientTimestamp(input.clientCreatedAt);
        await tx.$queryRaw`SELECT id FROM "sales" WHERE id = ${saleId} FOR UPDATE`;
        const sale = await tx.sale.findFirst({
          where: { id: saleId, pharmacyId },
          include: {
            items: {
              include: {
                stockAllocations: { orderBy: { createdAt: 'asc' } },
              },
              orderBy: { id: 'asc' },
            },
          },
        });
        if (!sale) throw new NotFoundException('Sale not found');

        const isCancellation = input.type === SaleReturnType.CANCELLATION;
        if (isCancellation) {
          if (sale.status !== SaleStatus.COMPLETED) {
            throw new ConflictException(
              'Only a completed sale without prior returns can be cancelled',
            );
          }
        } else if (
          sale.status === SaleStatus.CANCELLED ||
          sale.status === SaleStatus.RETURNED
        ) {
          throw new ConflictException('Sale cannot accept additional returns');
        }

        const requestedItems = isCancellation
          ? sale.items.map((item) => ({
              saleItemId: item.id,
              quantity: item.quantity,
            }))
          : input.items ?? [];
        this.assertUniqueIds(
          requestedItems.map((item) => item.saleItemId),
          'Duplicate sale items are not allowed in a return',
        );

        const returnLines = requestedItems.map((requested) => {
          const saleItem = sale.items.find(
            (item) => item.id === requested.saleItemId,
          );
          if (!saleItem) {
            throw new BadRequestException(
              `Sale item ${requested.saleItemId} does not belong to this sale`,
            );
          }
          const remainingQuantity =
            saleItem.quantity - saleItem.returnedQuantity;
          if (
            !Number.isInteger(requested.quantity) ||
            requested.quantity <= 0 ||
            requested.quantity > remainingQuantity
          ) {
            throw new BadRequestException(
              `Invalid return quantity for sale item ${saleItem.id}`,
            );
          }

          const remainingValue = saleItem.netAmount.minus(
            saleItem.returnedAmount,
          );
          const returnAmount =
            requested.quantity === remainingQuantity
              ? remainingValue
              : this.money(
                  saleItem.netAmount
                    .mul(requested.quantity)
                    .div(saleItem.quantity),
                );
          return { requested, saleItem, returnAmount };
        });
        const returnAmount = this.money(
          returnLines.reduce(
            (sum, line) => sum.plus(line.returnAmount),
            new Prisma.Decimal(0),
          ),
        );
        const refundableBalance = Prisma.Decimal.max(
          new Prisma.Decimal(0),
          sale.paidAmount.minus(sale.refundedAmount),
        );
        const refundAmount = Prisma.Decimal.min(
          returnAmount,
          refundableBalance,
        );
        const refundPayments = this.prepareRefundPayments(
          input.refunds,
          refundAmount,
        );

        const saleReturn = await tx.saleReturn.create({
          data: {
            returnNumber: await generateOrderNumber(
              tx,
              isCancellation ? 'CAN' : 'RET',
            ),
            saleId,
            pharmacyId,
            staffUserId,
            type: input.type,
            reason: input.reason.trim(),
            returnAmount,
            refundAmount,
            clientMutationId: input.clientMutationId,
            mutationHash,
            deviceId: input.deviceId.trim(),
            clientCreatedAt: input.clientCreatedAt
              ? new Date(input.clientCreatedAt)
              : null,
          },
        });

        for (const line of returnLines) {
          const returnItem = await tx.saleReturnItem.create({
            data: {
              saleReturnId: saleReturn.id,
              saleItemId: line.saleItem.id,
              quantity: line.requested.quantity,
              returnAmount: line.returnAmount,
            },
          });

          await tx.saleItem.update({
            where: { id: line.saleItem.id },
            data: {
              returnedQuantity: { increment: line.requested.quantity },
              returnedAmount: { increment: line.returnAmount },
            },
          });

          await this.restoreOriginalAllocations(
            tx,
            pharmacyId,
            staffUserId,
            sale.id,
            sale.saleNumber,
            saleReturn.id,
            returnItem.id,
            line.saleItem.stockAllocations,
            line.requested.quantity,
            isCancellation,
          );
        }

        if (refundPayments.length) {
          await tx.salePayment.createMany({
            data: refundPayments.map((payment) => ({
              saleId,
              saleReturnId: saleReturn.id,
              type: SalePaymentType.REFUND,
              method: payment.method,
              amount: payment.amount,
              tenderedAmount: payment.amount,
              changeAmount: 0,
              reference: payment.reference,
              receivedByUserId: staffUserId,
            })),
          });
        }

        const returnedByItem = new Map(
          returnLines.map((line) => [
            line.saleItem.id,
            line.requested.quantity,
          ]),
        );
        const allReturned = sale.items.every(
          (item) =>
            item.returnedQuantity + (returnedByItem.get(item.id) ?? 0) ===
            item.quantity,
        );
        const newRefundedAmount = sale.refundedAmount.plus(refundAmount);
        const newStatus = isCancellation
          ? SaleStatus.CANCELLED
          : allReturned
            ? SaleStatus.RETURNED
            : SaleStatus.PARTIALLY_RETURNED;

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: newStatus,
            refundedAmount: newRefundedAmount,
            paymentStatus: this.refundPaymentStatus(
              sale.paidAmount,
              newRefundedAmount,
              sale.totalAmount,
            ),
            serverVersion: { increment: 1 },
            ...(isCancellation
              ? {
                  cancelledAt: new Date(),
                  cancelledByUserId: staffUserId,
                  cancellationReason: input.reason.trim(),
                }
              : {}),
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: isCancellation ? 'SaleCancellation' : 'SaleReturn',
            entityId: saleReturn.id,
            action: isCancellation ? 'POS_SALE_CANCEL' : 'POS_SALE_RETURN',
            userId: staffUserId,
            orgId: pharmacyId,
            userRole: UserRole.PHARMACY,
            prevValues: {
              saleStatus: sale.status,
              refundedAmount: sale.refundedAmount.toString(),
            },
            newValues: {
              saleId,
              saleNumber: sale.saleNumber,
              returnNumber: saleReturn.returnNumber,
              saleStatus: newStatus,
              returnAmount: returnAmount.toString(),
              refundAmount: refundAmount.toString(),
              clientMutationId: input.clientMutationId,
              deviceId: input.deviceId,
            },
            reason: input.reason.trim(),
          },
        });

        return this.getReturnDetailsTx(tx, pharmacyId, saleReturn.id);
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const replay = await this.findReturnByMutation(
          pharmacyId,
          input.clientMutationId,
        );
        if (replay) return this.assertIdempotent(replay, mutationHash);
      }
      throw error;
    }
  }

  private async prepareSale(
    tx: Prisma.TransactionClient,
    pharmacyId: string,
    dto: CreateSaleDto,
  ) {
    this.assertUniqueIds(
      dto.items.map((item) => item.productId),
      'Duplicate products are not allowed in a sale',
    );
    const productIds = dto.items.map((item) => item.productId).sort();
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        barcode: true,
        tradeNameAr: true,
        tradeNameEn: true,
      },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }

    const pricedBatches = await tx.inventory.findMany({
      where: {
        pharmacyId,
        productId: { in: productIds },
        deletedAt: null,
        expiryDate: { gt: new Date() },
        quantity: { gt: 0 },
        sellingPrice: { not: null },
      },
      select: {
        productId: true,
        sellingPrice: true,
        quantity: true,
        reservedStock: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
    const priceByProduct = new Map<string, Prisma.Decimal>();
    for (const batch of pricedBatches) {
      if (
        batch.quantity > batch.reservedStock &&
        batch.sellingPrice &&
        !priceByProduct.has(batch.productId)
      ) {
        priceByProduct.set(batch.productId, batch.sellingPrice);
      }
    }

    const items = [...dto.items]
      .sort((a, b) => a.productId.localeCompare(b.productId))
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId)!;
        const authoritativePrice = priceByProduct.get(item.productId);
        if (!authoritativePrice) {
          throw new ConflictException(
            `No selling price is configured for product ${item.productId}`,
          );
        }
        const clientPrice = this.money(item.unitPrice);
        const unitPrice = this.money(authoritativePrice);
        if (!clientPrice.equals(unitPrice)) {
          throw new ConflictException(
            `Selling price changed for product ${item.productId}; refresh inventory and retry`,
          );
        }
        const grossAmount = this.money(unitPrice.mul(item.quantity));
        const lineDiscountAmount = this.money(item.lineDiscountAmount ?? 0);
        if (lineDiscountAmount.greaterThan(grossAmount)) {
          throw new BadRequestException(
            `Line discount exceeds gross amount for product ${item.productId}`,
          );
        }
        return {
          dto: item,
          product,
          unitPrice,
          grossAmount,
          lineDiscountAmount,
          lineNetAmount: grossAmount.minus(lineDiscountAmount),
          saleDiscountAmount: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(0),
        };
      });
    const subtotal = this.money(
      items.reduce(
        (sum, item) => sum.plus(item.grossAmount),
        new Prisma.Decimal(0),
      ),
    );
    const lineDiscountTotal = this.money(
      items.reduce(
        (sum, item) => sum.plus(item.lineDiscountAmount),
        new Prisma.Decimal(0),
      ),
    );
    const afterLineDiscount = subtotal.minus(lineDiscountTotal);
    const saleDiscount = this.calculateSaleDiscount(
      dto.discount,
      afterLineDiscount,
    );

    let unallocatedDiscount = saleDiscount;
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const allocation =
        isLast || afterLineDiscount.isZero()
          ? unallocatedDiscount
          : this.money(
              saleDiscount.mul(item.lineNetAmount).div(afterLineDiscount),
            );
      item.saleDiscountAmount = Prisma.Decimal.min(
        allocation,
        item.lineNetAmount,
      );
      item.netAmount = item.lineNetAmount.minus(item.saleDiscountAmount);
      unallocatedDiscount = unallocatedDiscount.minus(
        item.saleDiscountAmount,
      );
    });

    return {
      items,
      subtotal,
      discountAmount: lineDiscountTotal.plus(saleDiscount),
      totalAmount: afterLineDiscount.minus(saleDiscount),
    };
  }

  private calculateSaleDiscount(
    discount: CreateSaleDto['discount'],
    eligibleAmount: Prisma.Decimal,
  ) {
    if (!discount) return new Prisma.Decimal(0);
    const value = new Prisma.Decimal(discount.value);
    if (discount.type === DiscountType.PERCENTAGE) {
      if (value.greaterThan(100)) {
        throw new BadRequestException('Percentage discount cannot exceed 100');
      }
      return this.money(eligibleAmount.mul(value).div(100));
    }
    if (value.greaterThan(eligibleAmount)) {
      throw new BadRequestException('Fixed discount exceeds eligible amount');
    }
    return this.money(value);
  }

  private prepareSalePayments(
    payments: PosPaymentDto[],
    totalAmount: Prisma.Decimal,
  ) {
    let remaining = totalAmount;
    let tenderedAmount = new Prisma.Decimal(0);
    let paidAmount = new Prisma.Decimal(0);
    let changeAmount = new Prisma.Decimal(0);
    const prepared = payments.map((payment) => {
      this.assertPaymentReference(payment);
      const tendered = this.money(payment.amount);
      if (remaining.isZero() && payment.method !== SalePaymentMethod.CASH) {
        throw new BadRequestException('Only cash may exceed the sale total');
      }
      if (tendered.greaterThan(remaining) && payment.method !== SalePaymentMethod.CASH) {
        throw new BadRequestException('Non-cash payment exceeds the remaining balance');
      }
      const applied = Prisma.Decimal.min(tendered, remaining);
      const change = tendered.minus(applied);
      remaining = remaining.minus(applied);
      tenderedAmount = tenderedAmount.plus(tendered);
      paidAmount = paidAmount.plus(applied);
      changeAmount = changeAmount.plus(change);
      return {
        method: payment.method,
        amount: applied,
        tenderedAmount: tendered,
        changeAmount: change,
        reference: payment.reference?.trim() || null,
      };
    });
    return {
      payments: prepared,
      paidAmount: this.money(paidAmount),
      tenderedAmount: this.money(tenderedAmount),
      changeAmount: this.money(changeAmount),
    };
  }

  private prepareRefundPayments(
    payments: PosPaymentDto[],
    expectedAmount: Prisma.Decimal,
  ) {
    const prepared = payments.map((payment) => {
      this.assertPaymentReference(payment);
      return {
        method: payment.method,
        amount: this.money(payment.amount),
        reference: payment.reference?.trim() || null,
      };
    });
    const supplied = this.money(
      prepared.reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Prisma.Decimal(0),
      ),
    );
    if (!supplied.equals(expectedAmount)) {
      throw new BadRequestException(
        `Refund payments must equal ${expectedAmount.toFixed(2)}`,
      );
    }
    return prepared;
  }

  private async restoreOriginalAllocations(
    tx: Prisma.TransactionClient,
    pharmacyId: string,
    staffUserId: string,
    saleId: string,
    saleNumber: string,
    saleReturnId: string,
    returnItemId: string,
    allocations: Array<{
      id: string;
      inventoryId: string;
      quantity: number;
      returnedQuantity: number;
    }>,
    requiredQuantity: number,
    isCancellation: boolean,
  ) {
    let remaining = requiredQuantity;
    for (const allocation of allocations) {
      if (remaining <= 0) break;
      const available = allocation.quantity - allocation.returnedQuantity;
      if (available <= 0) continue;
      const restored = Math.min(available, remaining);
      remaining -= restored;

      await tx.$queryRaw`SELECT id FROM "inventory" WHERE id = ${allocation.inventoryId} FOR UPDATE`;
      const inventory = await tx.inventory.findUnique({
        where: { id: allocation.inventoryId },
      });
      if (!inventory || inventory.pharmacyId !== pharmacyId) {
        throw new ConflictException('Original inventory allocation is unavailable');
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { increment: restored },
          deletedAt: null,
          deletedBy: null,
        },
      });
      await tx.saleStockAllocation.update({
        where: { id: allocation.id },
        data: { returnedQuantity: { increment: restored } },
      });
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          productId: inventory.productId,
          pharmacyId,
          batchNumber: inventory.batchNumber,
          type: isCancellation
            ? MovementType.POS_CANCELLATION
            : MovementType.POS_RETURN,
          quantity: restored,
          prevQuantity: inventory.quantity,
          newQuantity: inventory.quantity + restored,
          difference: restored,
          referenceId: returnItemId,
          saleId,
          saleReturnId,
          userId: staffUserId,
          reason: `${isCancellation ? 'POS cancellation' : 'POS return'} for ${saleNumber}`,
        },
      });
    }
    if (remaining > 0) {
      throw new ConflictException('Return exceeds original batch allocations');
    }
  }

  private async assertPharmacyStaff(
    tx: Prisma.TransactionClient,
    pharmacyId: string,
    userId: string,
  ) {
    const pharmacy = await tx.pharmacy.findFirst({
      where: {
        id: pharmacyId,
        userId,
        status: OrgStatus.APPROVED,
        deletedAt: null,
        user: { status: 'ACTIVE', deletedAt: null },
      },
      select: { id: true },
    });
    if (!pharmacy) {
      throw new ForbiddenException(
        'Authenticated user cannot record POS activity for this pharmacy',
      );
    }
  }

  private async findSaleByMutation(
    pharmacyId: string,
    clientMutationId: string,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    return client.sale.findUnique({
      where: { pharmacyId_clientMutationId: { pharmacyId, clientMutationId } },
      include: this.saleDetailsInclude(),
    });
  }

  private async findReturnByMutation(
    pharmacyId: string,
    clientMutationId: string,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    return client.saleReturn.findUnique({
      where: { pharmacyId_clientMutationId: { pharmacyId, clientMutationId } },
      include: this.returnDetailsInclude(),
    });
  }

  private async getSaleDetailsTx(
    client: PrismaService | Prisma.TransactionClient,
    pharmacyId: string,
    saleId: string,
  ) {
    return client.sale.findFirst({
      where: { id: saleId, pharmacyId },
      include: this.saleDetailsInclude(),
    });
  }

  private async getReturnDetailsTx(
    client: PrismaService | Prisma.TransactionClient,
    pharmacyId: string,
    returnId: string,
  ) {
    return client.saleReturn.findFirst({
      where: { id: returnId, pharmacyId },
      include: this.returnDetailsInclude(),
    });
  }

  private saleDetailsInclude() {
    return {
      staffUser: {
        select: { id: true, firstName: true, lastName: true },
      },
      items: {
        include: {
          stockAllocations: {
            include: {
              inventory: {
                select: {
                  id: true,
                  batchNumber: true,
                  expiryDate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
      payments: { orderBy: { createdAt: 'asc' as const } },
      returns: {
        include: {
          items: true,
          refundPayments: true,
          staffUser: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private returnDetailsInclude() {
    return {
      staffUser: {
        select: { id: true, firstName: true, lastName: true },
      },
      items: {
        include: {
          saleItem: {
            select: {
              id: true,
              productId: true,
              productNameAr: true,
              productNameEn: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      },
      refundPayments: { orderBy: { createdAt: 'asc' as const } },
      sale: {
        select: {
          id: true,
          saleNumber: true,
          status: true,
          paymentStatus: true,
        },
      },
    };
  }

  private assertIdempotent<T extends { mutationHash: string }>(
    record: T,
    expectedHash: string,
  ) {
    if (record.mutationHash !== expectedHash) {
      throw new ConflictException(
        'clientMutationId was already used with a different payload',
      );
    }
    return record;
  }

  private hashMutation(value: unknown) {
    return createHash('sha256')
      .update(JSON.stringify(this.canonicalize(value)))
      .digest('hex');
  }

  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((entry) => this.canonicalize(entry));
    if (value && typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((result, key) => {
          result[key] = this.canonicalize(
            (value as Record<string, unknown>)[key],
          );
          return result;
        }, {});
    }
    return value;
  }

  private assertUniqueIds(ids: string[], message: string) {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(message);
    }
  }

  private assertPaymentReference(payment: PosPaymentDto) {
    const methodsRequiringReference = new Set<SalePaymentMethod>([
        SalePaymentMethod.CARD,
        SalePaymentMethod.BANK_TRANSFER,
        SalePaymentMethod.MOBILE_WALLET,
      ]);
    if (
      methodsRequiringReference.has(payment.method) &&
      !payment.reference?.trim()
    ) {
      throw new BadRequestException(
        `${payment.method} payment requires a reference`,
      );
    }
  }

  private assertClientTimestamp(clientCreatedAt?: string) {
    if (!clientCreatedAt) return;
    const timestamp = new Date(clientCreatedAt);
    if (timestamp.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      throw new BadRequestException(
        'clientCreatedAt cannot be more than 24 hours in the future',
      );
    }
  }

  private salePaymentStatus(
    paidAmount: Prisma.Decimal,
    totalAmount: Prisma.Decimal,
  ) {
    if (paidAmount.isZero()) return SalePaymentStatus.UNPAID;
    if (paidAmount.greaterThanOrEqualTo(totalAmount)) {
      return SalePaymentStatus.PAID;
    }
    return SalePaymentStatus.PARTIALLY_PAID;
  }

  private refundPaymentStatus(
    paidAmount: Prisma.Decimal,
    refundedAmount: Prisma.Decimal,
    totalAmount: Prisma.Decimal,
  ) {
    if (paidAmount.isZero()) return SalePaymentStatus.UNPAID;
    if (refundedAmount.greaterThanOrEqualTo(paidAmount)) {
      return SalePaymentStatus.REFUNDED;
    }
    if (refundedAmount.greaterThan(0)) {
      return SalePaymentStatus.PARTIALLY_REFUNDED;
    }
    return this.salePaymentStatus(paidAmount, totalAmount);
  }

  private money(value: Prisma.Decimal.Value) {
    return new Prisma.Decimal(value).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );
  }

  private async withSerializableRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (this.isRetryableTransactionError(error) && attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, attempt * 20 + Math.floor(Math.random() * 30)),
          );
          continue;
        }
        throw error;
      }
    }
    throw new Error('POS transaction retry loop exhausted unexpectedly');
  }

  private isRetryableTransactionError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
