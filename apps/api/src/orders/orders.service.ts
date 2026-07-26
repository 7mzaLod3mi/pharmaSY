import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, OrgStatus, Prisma, ProductStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRole } from '@pharmasyn/types';
import { PrismaService } from '../prisma/prisma.service';
import { generateOrderNumber } from '../common/utils/order-number.util';
import type {
  CheckoutGroupDto,
  CheckoutItemDto,
  CreateOrderDto,
} from './orders.controller';

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async checkout(pharmacyId: string, userId: string, dto: CreateOrderDto) {
    this.validateCheckoutPayload(dto);

    if (dto.clientMutationId) {
      const existing = await this.findCheckoutByMutation(
        pharmacyId,
        dto.clientMutationId,
      );
      if (existing) return existing;
    }

    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await this.prisma.$transaction(
          async (tx) => this.createCheckout(tx, pharmacyId, userId, dto),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        await this.emitOrderCreatedEvents(result.orders);
        return result;
      } catch (error) {
        if (dto.clientMutationId && this.isUniqueConstraintError(error)) {
          const existing = await this.findCheckoutByMutation(
            pharmacyId,
            dto.clientMutationId,
          );
          if (existing) return existing;
        }
        if (this.isRetryableTransactionError(error) && attempt < maxAttempts) {
          await this.delay(attempt * 20 + Math.floor(Math.random() * 30));
          continue;
        }
        throw error;
      }
    }

    throw new Error('Checkout retry loop exhausted unexpectedly');
  }

  async findPharmacyOrders(pharmacyId: string, page = 1, limit = 20) {
    const pagination = this.normalizePagination(page, limit);
    const where: Prisma.OrderWhereInput = { pharmacyId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, logoUrl: true } },
          sellerPharmacy: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      data,
      meta: this.paginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async findSupplierOrders(
    supplierId: string,
    page = 1,
    limit = 20,
    status?: OrderStatus,
  ) {
    if (status && !Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException('Invalid order status');
    }

    const pagination = this.normalizePagination(page, limit);
    const where: Prisma.OrderWhereInput = {
      supplierId,
      deletedAt: null,
      ...(status ? { status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          pharmacy: { select: { id: true, name: true, city: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      data,
      meta: this.paginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async getOrderDetails(orderId: string, orgId: string, role: UserRole) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            city: true,
          },
        },
        supplier: { select: { id: true, name: true, phone: true, city: true } },
        sellerPharmacy: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            city: true,
          },
        },
        items: {
          include: {
            supplierProduct: {
              include: {
                product: {
                  select: {
                    id: true,
                    tradeNameAr: true,
                    tradeNameEn: true,
                    unit: true,
                    barcode: true,
                  },
                },
              },
            },
            marketplaceOffer: {
              include: {
                product: {
                  select: {
                    id: true,
                    tradeNameAr: true,
                    tradeNameEn: true,
                    unit: true,
                    barcode: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const canView =
      role === UserRole.ADMIN ||
      (role === UserRole.PHARMACY &&
        (order.pharmacyId === orgId || order.sellerPharmacyId === orgId)) ||
      (role === UserRole.SUPPLIER && order.supplierId === orgId);
    if (!canView) throw new ForbiddenException('Access denied');

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    sellerId: string,
    sellerRole: UserRole,
    targetStatus: OrderStatus,
    userId: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.order.findFirst({
        where: { id: orderId, deletedAt: null },
        include: {
          pharmacy: { select: { userId: true } },
          supplier: { select: { userId: true } },
          sellerPharmacy: { select: { userId: true } },
          items: {
            include: {
              supplierProduct: true,
              marketplaceOffer: { include: { originalInventory: true } },
            },
          },
        },
      });
      if (!order) throw new NotFoundException('Order not found');

      const isAuthorizedSeller =
        (sellerRole === UserRole.SUPPLIER && order.supplierId === sellerId) ||
        (sellerRole === UserRole.PHARMACY &&
          order.sellerPharmacyId === sellerId);
      const isBuyerCancellation =
        sellerRole === UserRole.PHARMACY &&
        order.pharmacyId === sellerId &&
        targetStatus === OrderStatus.CANCELLED &&
        (order.status === OrderStatus.PENDING ||
          order.status === OrderStatus.CONFIRMED);
      const isBuyerDeliveryConfirmation =
        sellerRole === UserRole.PHARMACY &&
        order.pharmacyId === sellerId &&
        targetStatus === OrderStatus.DELIVERED &&
        order.status === OrderStatus.SHIPPED;
      if (
        (!isAuthorizedSeller &&
          !isBuyerCancellation &&
          !isBuyerDeliveryConfirmation) ||
        (isAuthorizedSeller && targetStatus === OrderStatus.DELIVERED)
      ) {
        throw new ForbiddenException('Access denied');
      }
      if (order.status === targetStatus) return order;

      if (!ORDER_TRANSITIONS[order.status].includes(targetStatus)) {
        throw new BadRequestException(
          `Invalid order transition from ${order.status} to ${targetStatus}`,
        );
      }

      if (targetStatus === OrderStatus.CANCELLED) {
        await this.restoreCancelledOrderStock(tx, order);
      }
      if (targetStatus === OrderStatus.DELIVERED) {
        await this.receiveDeliveredOrder(tx, order, userId);
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: targetStatus },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'Order',
          entityId: orderId,
          action: 'STATUS_CHANGE',
          userId,
          orgId: sellerId,
          userRole: sellerRole,
          prevValues: { status: order.status },
          newValues: { status: targetStatus },
        },
      });

      return {
        ...updated,
        pharmacy: order.pharmacy,
        supplier: order.supplier,
        sellerPharmacy: order.sellerPharmacy,
      };
    });

    const actorIsBuyer =
      sellerRole === UserRole.PHARMACY && result.pharmacyId === sellerId;
    const sellerUserId =
      result.supplier?.userId ?? result.sellerPharmacy?.userId;
    const recipientUserId = actorIsBuyer
      ? sellerUserId
      : result.pharmacy.userId;
    if (recipientUserId)
      await this.emitSafely('order.status_changed', {
        order: result,
        recipientUserId,
        actionUrl: actorIsBuyer
          ? result.supplierId
            ? `/supplier/orders/${result.id}`
            : '/pharmacy/exchange'
          : `/pharmacy/orders/${result.id}`,
        newStatus: targetStatus,
      });
    return result;
  }

  private async createCheckout(
    tx: Prisma.TransactionClient,
    pharmacyId: string,
    userId: string,
    dto: CreateOrderDto,
  ) {
    if (dto.clientMutationId) {
      const existing = await tx.checkoutGroup.findUnique({
        where: {
          pharmacyId_clientMutationId: {
            pharmacyId,
            clientMutationId: dto.clientMutationId,
          },
        },
      });
      if (existing) {
        const orders = await tx.order.findMany({
          where: { checkoutGroupId: existing.id },
          include: {
            items: true,
            pharmacy: { select: { userId: true, name: true } },
            supplier: { select: { userId: true, name: true } },
            sellerPharmacy: { select: { userId: true, name: true } },
          },
        });
        return { checkoutGroup: existing, orders };
      }
    }

    const checkoutGroup = await tx.checkoutGroup.create({
      data: {
        checkoutNumber: await generateOrderNumber(tx, 'CHK'),
        pharmacyId,
        totalAmount: new Prisma.Decimal(0),
        orderCount: dto.groups.length,
        createdByUserId: userId,
        clientMutationId: dto.clientMutationId,
        deviceId: dto.deviceId,
      },
    });

    let overallTotal = new Prisma.Decimal(0);
    const createdOrderIds: string[] = [];
    const sortedGroups = [...dto.groups].sort((a, b) =>
      a.supplierId.localeCompare(b.supplierId),
    );

    for (const group of sortedGroups) {
      const prepared = await this.prepareGroup(tx, pharmacyId, group);
      overallTotal = overallTotal.plus(prepared.total);
      const order = await tx.order.create({
        data: {
          orderNumber: await generateOrderNumber(tx, 'PSY'),
          checkoutGroupId: checkoutGroup.id,
          pharmacyId,
          supplierId: prepared.kind === 'SUPPLIER' ? group.supplierId : null,
          sellerPharmacyId:
            prepared.kind === 'PHARMACY' ? group.supplierId : null,
          totalAmount: prepared.total,
          status: OrderStatus.PENDING,
          notes: group.notes,
          items: { create: prepared.items },
        },
      });
      createdOrderIds.push(order.id);
    }

    const updatedGroup = await tx.checkoutGroup.update({
      where: { id: checkoutGroup.id },
      data: { totalAmount: overallTotal },
    });
    await tx.auditLog.create({
      data: {
        entityType: 'CheckoutGroup',
        entityId: checkoutGroup.id,
        action: 'CREATE',
        userId,
        orgId: pharmacyId,
        userRole: UserRole.PHARMACY,
        newValues: {
          checkoutNumber: updatedGroup.checkoutNumber,
          orderCount: updatedGroup.orderCount,
          clientMutationId: dto.clientMutationId,
        },
      },
    });

    const orders = await tx.order.findMany({
      where: { id: { in: createdOrderIds } },
      include: {
        items: true,
        pharmacy: { select: { userId: true, name: true } },
        supplier: { select: { userId: true, name: true } },
        sellerPharmacy: { select: { userId: true, name: true } },
      },
    });
    return { checkoutGroup: updatedGroup, orders };
  }

  private async prepareGroup(
    tx: Prisma.TransactionClient,
    buyerPharmacyId: string,
    group: CheckoutGroupDto,
  ) {
    let kind: 'SUPPLIER' | 'PHARMACY' | null = null;
    let total = new Prisma.Decimal(0);
    const items: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
    const sortedItems = [...group.items].sort((a, b) =>
      this.itemSourceId(a).localeCompare(this.itemSourceId(b)),
    );

    for (const item of sortedItems) {
      const itemKind = item.supplierProductId ? 'SUPPLIER' : 'PHARMACY';
      if (kind && kind !== itemKind) {
        throw new BadRequestException(
          'A checkout group cannot mix supplier and C2C offers',
        );
      }
      kind = itemKind;

      if (item.supplierProductId) {
        await tx.$queryRaw`SELECT id FROM "supplier_products" WHERE id = ${item.supplierProductId} FOR UPDATE`;
        const offer = await tx.supplierProduct.findUnique({
          where: { id: item.supplierProductId },
          include: { supplier: true, product: true },
        });
        if (!offer || !offer.isAvailable) {
          throw new BadRequestException(
            `Supplier offer ${item.supplierProductId} is unavailable`,
          );
        }
        if (
          offer.supplierId !== group.supplierId ||
          offer.supplier.status !== OrgStatus.APPROVED
        ) {
          throw new BadRequestException(
            'Supplier group does not match the selected offer',
          );
        }
        if (offer.product.status !== ProductStatus.ACTIVE) {
          throw new BadRequestException('Product is not active');
        }
        if (!offer.batchNumber || !offer.expiryDate) {
          throw new BadRequestException(
            'Supplier offer is missing batch or expiry information',
          );
        }
        if (offer.expiryDate <= new Date()) {
          throw new BadRequestException(
            'Expired supplier stock cannot be ordered',
          );
        }
        if (offer.stock < item.quantity || item.quantity < offer.minOrder) {
          throw new BadRequestException(
            `Invalid quantity for supplier offer ${offer.id}`,
          );
        }

        await tx.supplierProduct.update({
          where: { id: offer.id },
          data: { stock: { decrement: item.quantity } },
        });
        const unitPrice = this.resolveSupplierUnitPrice(
          offer.price,
          offer.quantityDiscounts,
          item.quantity,
        );
        const subtotal = unitPrice.mul(item.quantity);
        total = total.plus(subtotal);
        items.push({
          productId: offer.productId,
          supplierProductId: offer.id,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      } else {
        const offerId = item.marketplaceOfferId!;
        await tx.$queryRaw`SELECT id FROM "marketplace_offers" WHERE id = ${offerId} FOR UPDATE`;
        const offer = await tx.marketplaceOffer.findUnique({
          where: { id: offerId },
          include: { pharmacy: true, product: true, originalInventory: true },
        });
        if (
          !offer ||
          offer.status !== 'ACTIVE' ||
          offer.pharmacyId !== group.supplierId ||
          offer.pharmacy.status !== OrgStatus.APPROVED
        ) {
          throw new BadRequestException(`C2C offer ${offerId} is unavailable`);
        }
        if (offer.pharmacyId === buyerPharmacyId) {
          throw new BadRequestException('A pharmacy cannot buy its own offer');
        }
        if (offer.expiryDate <= new Date()) {
          throw new BadRequestException('Expired C2C stock cannot be ordered');
        }
        const remaining = offer.publishedQuantity - offer.soldQuantity;
        if (
          remaining < item.quantity ||
          offer.originalInventory.quantity < item.quantity ||
          offer.originalInventory.reservedStock < item.quantity
        ) {
          throw new BadRequestException(
            `Insufficient stock for C2C offer ${offer.id}`,
          );
        }

        await tx.marketplaceOffer.update({
          where: { id: offer.id },
          data: { soldQuantity: { increment: item.quantity } },
        });
        const subtotal = offer.price.mul(item.quantity);
        total = total.plus(subtotal);
        items.push({
          productId: offer.productId,
          marketplaceOfferId: offer.id,
          quantity: item.quantity,
          unitPrice: offer.price,
          subtotal,
        });
      }
    }

    if (!kind) throw new BadRequestException('Checkout group is empty');
    return { kind, total, items };
  }

  private async restoreCancelledOrderStock(
    tx: Prisma.TransactionClient,
    order: Prisma.OrderGetPayload<{
      include: {
        pharmacy: { select: { userId: true } };
        items: {
          include: {
            supplierProduct: true;
            marketplaceOffer: { include: { originalInventory: true } };
          };
        };
      };
    }>,
  ) {
    for (const item of order.items) {
      if (item.supplierProductId) {
        await tx.supplierProduct.update({
          where: { id: item.supplierProductId },
          data: { stock: { increment: item.quantity } },
        });
      } else if (item.marketplaceOfferId) {
        await tx.marketplaceOffer.update({
          where: { id: item.marketplaceOfferId },
          data: { soldQuantity: { decrement: item.quantity } },
        });
      }
    }
  }

  private async receiveDeliveredOrder(
    tx: Prisma.TransactionClient,
    order: Prisma.OrderGetPayload<{
      include: {
        pharmacy: { select: { userId: true } };
        items: {
          include: {
            supplierProduct: true;
            marketplaceOffer: { include: { originalInventory: true } };
          };
        };
      };
    }>,
    userId: string,
  ) {
    for (const item of order.items) {
      if (item.supplierProduct) {
        await this.receiveSupplierItem(tx, order, item, userId);
      } else if (item.marketplaceOffer) {
        await this.transferC2cItem(tx, order, item, userId);
      }
    }
  }

  private async receiveSupplierItem(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      orderNumber: string;
      pharmacyId: string;
      supplierId: string | null;
    },
    item: Prisma.OrderItemGetPayload<{ include: { supplierProduct: true } }>,
    userId: string,
  ) {
    const supplierProduct = item.supplierProduct!;
    if (!supplierProduct.batchNumber || !supplierProduct.expiryDate) {
      throw new BadRequestException(
        'Cannot receive supplier stock without batch and expiry information',
      );
    }
    const batchNumber = supplierProduct.batchNumber;
    const expiryDate = supplierProduct.expiryDate;
    const existing = await tx.inventory.findUnique({
      where: {
        pharmacyId_productId_batchNumber: {
          pharmacyId: order.pharmacyId,
          productId: item.productId,
          batchNumber,
        },
      },
    });
    const previousQuantity = existing?.quantity ?? 0;
    const inventory = existing
      ? await tx.inventory.update({
          where: { id: existing.id },
          data: {
            quantity: { increment: item.quantity },
            deletedAt: null,
            deletedBy: null,
          },
        })
      : await tx.inventory.create({
          data: {
            pharmacyId: order.pharmacyId,
            productId: item.productId,
            batchNumber,
            expiryDate,
            purchaseCost: item.unitPrice,
            supplierId: order.supplierId,
            quantity: item.quantity,
          },
        });

    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        productId: item.productId,
        pharmacyId: order.pharmacyId,
        batchNumber,
        type: 'SUPPLIER_PURCHASE',
        quantity: item.quantity,
        prevQuantity: previousQuantity,
        newQuantity: inventory.quantity,
        difference: item.quantity,
        referenceId: order.orderNumber,
        orderId: order.id,
        userId,
        reason: 'Supplier delivery',
      },
    });
  }

  private async transferC2cItem(
    tx: Prisma.TransactionClient,
    order: { id: string; orderNumber: string; pharmacyId: string },
    item: Prisma.OrderItemGetPayload<{
      include: { marketplaceOffer: { include: { originalInventory: true } } };
    }>,
    userId: string,
  ) {
    const offer = item.marketplaceOffer!;
    const sellerInventory = offer.originalInventory;
    await tx.inventory.update({
      where: { id: sellerInventory.id },
      data: {
        quantity: { decrement: item.quantity },
        reservedStock: { decrement: item.quantity },
      },
    });
    await tx.inventoryMovement.create({
      data: {
        inventoryId: sellerInventory.id,
        productId: item.productId,
        pharmacyId: sellerInventory.pharmacyId,
        batchNumber: sellerInventory.batchNumber,
        type: 'MARKETPLACE_SALE',
        quantity: item.quantity,
        prevQuantity: sellerInventory.quantity,
        newQuantity: sellerInventory.quantity - item.quantity,
        difference: -item.quantity,
        referenceId: order.orderNumber,
        orderId: order.id,
        marketplaceOfferId: offer.id,
        userId,
        reason: 'C2C sale delivered',
      },
    });

    const buyerBatchNumber = `EXC-${sellerInventory.batchNumber}`;
    const existingBuyerBatch = await tx.inventory.findUnique({
      where: {
        pharmacyId_productId_batchNumber: {
          pharmacyId: order.pharmacyId,
          productId: item.productId,
          batchNumber: buyerBatchNumber,
        },
      },
    });
    const previousQuantity = existingBuyerBatch?.quantity ?? 0;
    const buyerInventory = existingBuyerBatch
      ? await tx.inventory.update({
          where: { id: existingBuyerBatch.id },
          data: {
            quantity: { increment: item.quantity },
            deletedAt: null,
            deletedBy: null,
          },
        })
      : await tx.inventory.create({
          data: {
            pharmacyId: order.pharmacyId,
            productId: item.productId,
            batchNumber: buyerBatchNumber,
            expiryDate: sellerInventory.expiryDate,
            purchaseCost: item.unitPrice,
            quantity: item.quantity,
          },
        });
    await tx.inventoryMovement.create({
      data: {
        inventoryId: buyerInventory.id,
        productId: item.productId,
        pharmacyId: order.pharmacyId,
        batchNumber: buyerBatchNumber,
        type: 'MARKETPLACE_PURCHASE',
        quantity: item.quantity,
        prevQuantity: previousQuantity,
        newQuantity: buyerInventory.quantity,
        difference: item.quantity,
        referenceId: order.orderNumber,
        orderId: order.id,
        marketplaceOfferId: offer.id,
        userId,
        reason: 'C2C purchase delivered',
      },
    });
  }

  private validateCheckoutPayload(dto: CreateOrderDto) {
    if (!dto.groups?.length) throw new BadRequestException('Empty cart');
    const seenSources = new Set<string>();
    for (const group of dto.groups) {
      if (!group.items?.length)
        throw new BadRequestException('Checkout group is empty');
      for (const item of group.items) {
        if (
          Boolean(item.supplierProductId) === Boolean(item.marketplaceOfferId)
        ) {
          throw new BadRequestException(
            'Each checkout item must reference exactly one offer source',
          );
        }
        const sourceId = this.itemSourceId(item);
        if (seenSources.has(sourceId)) {
          throw new BadRequestException(
            'Duplicate offers must be combined into one item',
          );
        }
        seenSources.add(sourceId);
      }
    }
  }

  private itemSourceId(item: CheckoutItemDto) {
    return item.supplierProductId || item.marketplaceOfferId || '';
  }

  private resolveSupplierUnitPrice(
    basePrice: Prisma.Decimal,
    rawTiers: Prisma.JsonValue,
    quantity: number,
  ) {
    if (!Array.isArray(rawTiers)) return basePrice;
    let resolved = basePrice;
    for (const rawTier of rawTiers) {
      if (!rawTier || typeof rawTier !== 'object' || Array.isArray(rawTier)) {
        continue;
      }
      const tier = rawTier as Record<string, Prisma.JsonValue>;
      const minimum = Number(tier.minQuantity);
      const price = Number(tier.unitPrice);
      if (
        Number.isInteger(minimum) &&
        minimum > 0 &&
        quantity >= minimum &&
        Number.isFinite(price) &&
        price >= 0 &&
        price <= Number(resolved)
      ) {
        resolved = new Prisma.Decimal(price);
      }
    }
    return resolved;
  }

  private async findCheckoutByMutation(
    pharmacyId: string,
    clientMutationId: string,
  ) {
    const checkoutGroup = await this.prisma.checkoutGroup.findUnique({
      where: { pharmacyId_clientMutationId: { pharmacyId, clientMutationId } },
      include: { orders: { include: { items: true } } },
    });
    if (!checkoutGroup) return null;
    return { checkoutGroup, orders: checkoutGroup.orders };
  }

  private async emitOrderCreatedEvents(
    orders: Awaited<ReturnType<OrdersService['createCheckout']>>['orders'],
  ) {
    for (const order of orders) {
      const seller = order.supplier || order.sellerPharmacy;
      if (!seller) continue;
      await this.emitSafely('order.created', {
        order,
        sellerUserId: seller.userId,
        pharmacyName: order.pharmacy.name,
        actionUrl: order.supplier
          ? `/supplier/orders/${order.id}`
          : '/pharmacy/exchange',
      });
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private isRetryableTransactionError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }

  private async emitSafely(event: string, payload: Record<string, unknown>) {
    try {
      await this.eventEmitter.emitAsync(event, payload);
    } catch (error) {
      this.logger.error(`Post-commit event ${event} failed`, error);
    }
  }

  private async delay(milliseconds: number) {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  private normalizePagination(page: number, limit: number) {
    const normalizedPage = Math.max(1, Math.trunc(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Math.trunc(limit) || 20));
    return {
      page: normalizedPage,
      limit: normalizedLimit,
      skip: (normalizedPage - 1) * normalizedLimit,
    };
  }

  private paginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
