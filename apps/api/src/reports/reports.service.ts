import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  MovementType,
  OrderStatus,
  Prisma,
  ReportType,
  SaleStatus,
} from '@prisma/client';
import { UserRole } from '@pharmasyn/types';
import { PrismaService } from '../prisma/prisma.service';
import { ReportFiltersDto } from './dto/reports.dto';
import { ReportCell, ReportColumn, ReportResult } from './report.types';

const PHARMACY_REPORTS = new Set<ReportType>([
  ReportType.PHARMACY_POS_SALES,
  ReportType.PHARMACY_POS_RETURNS,
  ReportType.C2C_EXCHANGE,
  ReportType.ORDERS_FULFILLMENT,
  ReportType.INVENTORY_VALUE,
  ReportType.INVENTORY_MOVEMENTS,
  ReportType.LOW_STOCK,
  ReportType.EXPIRY,
  ReportType.PRODUCT_CATEGORY_PERFORMANCE,
]);

const SUPPLIER_REPORTS = new Set<ReportType>([
  ReportType.SUPPLIER_SALES,
  ReportType.ORDERS_FULFILLMENT,
  ReportType.PRODUCT_CATEGORY_PERFORMANCE,
]);

type ReportContext = {
  orgId: string;
  role: UserRole;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  catalog(role: UserRole) {
    if (role === UserRole.ADMIN) return [];
    const allowed =
      role === UserRole.PHARMACY ? PHARMACY_REPORTS : SUPPLIER_REPORTS;
    return [...allowed].map((reportType) => ({
      reportType,
      titleAr: TITLES[reportType].ar,
      titleEn: TITLES[reportType].en,
    }));
  }

  assertAccess(reportType: ReportType, role: UserRole, orgId?: string) {
    if (!orgId)
      throw new ForbiddenException('Organization context is required');
    const allowed =
      role === UserRole.PHARMACY
        ? PHARMACY_REPORTS
        : role === UserRole.SUPPLIER
          ? SUPPLIER_REPORTS
          : undefined;
    if (!allowed?.has(reportType)) {
      throw new ForbiddenException(
        'This report is not available for your organization role',
      );
    }
  }

  async generate(
    reportType: ReportType,
    context: ReportContext,
    filters: ReportFiltersDto = {},
  ): Promise<ReportResult> {
    this.assertAccess(reportType, context.role, context.orgId);
    this.validateDateRange(filters);

    switch (reportType) {
      case ReportType.PHARMACY_POS_SALES:
        return this.posSales(context.orgId, filters);
      case ReportType.PHARMACY_POS_RETURNS:
        return this.posReturns(context.orgId, filters);
      case ReportType.SUPPLIER_SALES:
        return this.supplierSales(context.orgId, filters);
      case ReportType.C2C_EXCHANGE:
        return this.c2cExchange(context.orgId, filters);
      case ReportType.ORDERS_FULFILLMENT:
        return this.ordersFulfillment(context, filters);
      case ReportType.INVENTORY_VALUE:
        return this.inventoryValue(context.orgId, filters);
      case ReportType.INVENTORY_MOVEMENTS:
        return this.inventoryMovements(context.orgId, filters);
      case ReportType.LOW_STOCK:
        return this.lowStock(context.orgId, filters);
      case ReportType.EXPIRY:
        return this.expiry(context.orgId, filters);
      case ReportType.PRODUCT_CATEGORY_PERFORMANCE:
        return this.performance(context, filters);
      default:
        throw new BadRequestException('Unsupported report type');
    }
  }

  paginate(result: ReportResult, filters: ReportFiltersDto) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 100, 1000);
    const total = result.rows.length;
    const totalPages = Math.ceil(total / limit);
    return {
      ...result,
      rows: result.rows.slice((page - 1) * limit, page * limit),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private async posSales(pharmacyId: string, filters: ReportFiltersDto) {
    const status = this.saleStatus(filters.status);
    const sales = await this.prisma.sale.findMany({
      where: {
        pharmacyId,
        createdAt: this.dateFilter(filters),
        ...(status ? { status } : {}),
      },
      include: {
        staffUser: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const rows = sales.map((sale) => ({
      saleNumber: sale.saleNumber,
      createdAt: sale.createdAt,
      staff: `${sale.staffUser.firstName} ${sale.staffUser.lastName}`,
      status: sale.status,
      itemCount: sale._count.items,
      subtotal: this.number(sale.subtotal),
      discount: this.number(sale.discountAmount),
      total: this.number(sale.totalAmount),
      paid: this.number(sale.paidAmount),
      refunded: this.number(sale.refundedAmount),
      net: this.number(sale.totalAmount) - this.number(sale.refundedAmount),
    }));
    return this.result(ReportType.PHARMACY_POS_SALES, POS_SALES_COLUMNS, rows, {
      saleCount: rows.length,
      grossSales: this.sum(rows, 'total'),
      discounts: this.sum(rows, 'discount'),
      refunds: this.sum(rows, 'refunded'),
      netSales: this.sum(rows, 'net'),
    });
  }

  private async posReturns(pharmacyId: string, filters: ReportFiltersDto) {
    const returns = await this.prisma.saleReturn.findMany({
      where: {
        pharmacyId,
        createdAt: this.dateFilter(filters),
      },
      include: {
        sale: { select: { saleNumber: true } },
        staffUser: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const rows = returns.map((item) => ({
      returnNumber: item.returnNumber,
      saleNumber: item.sale.saleNumber,
      createdAt: item.createdAt,
      type: item.type,
      staff: `${item.staffUser.firstName} ${item.staffUser.lastName}`,
      itemCount: item._count.items,
      returnAmount: this.number(item.returnAmount),
      refundAmount: this.number(item.refundAmount),
      reason: item.reason,
    }));
    return this.result(
      ReportType.PHARMACY_POS_RETURNS,
      POS_RETURN_COLUMNS,
      rows,
      {
        returnCount: rows.length,
        returnedValue: this.sum(rows, 'returnAmount'),
        refundedValue: this.sum(rows, 'refundAmount'),
      },
    );
  }

  private async supplierSales(supplierId: string, filters: ReportFiltersDto) {
    const status = this.orderStatus(filters.status);
    const orders = await this.prisma.order.findMany({
      where: {
        supplierId,
        deletedAt: null,
        createdAt: this.dateFilter(filters),
        ...(status ? { status } : {}),
      },
      include: {
        pharmacy: { select: { name: true, city: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const rows = orders.map((order) => ({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      pharmacy: order.pharmacy.name,
      city: order.pharmacy.city,
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemCount: order._count.items,
      total: this.number(order.totalAmount),
    }));
    return this.result(
      ReportType.SUPPLIER_SALES,
      SUPPLIER_SALES_COLUMNS,
      rows,
      {
        orderCount: rows.length,
        orderValue: this.sum(rows, 'total'),
        deliveredValue: rows
          .filter((row) => row.status === OrderStatus.DELIVERED)
          .reduce((sum, row) => sum + row.total, 0),
      },
    );
  }

  private async c2cExchange(pharmacyId: string, filters: ReportFiltersDto) {
    const status = this.orderStatus(filters.status);
    const orders = await this.prisma.order.findMany({
      where: {
        sellerPharmacyId: { not: null },
        deletedAt: null,
        OR: [{ pharmacyId }, { sellerPharmacyId: pharmacyId }],
        createdAt: this.dateFilter(filters),
        ...(status ? { status } : {}),
      },
      include: {
        pharmacy: { select: { name: true } },
        sellerPharmacy: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const rows = orders.map((order) => {
      const direction =
        order.sellerPharmacyId === pharmacyId ? 'SALE' : 'PURCHASE';
      return {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        direction,
        counterparty:
          direction === 'SALE'
            ? order.pharmacy.name
            : (order.sellerPharmacy?.name ?? ''),
        status: order.status,
        itemCount: order._count.items,
        total: this.number(order.totalAmount),
      };
    });
    return this.result(ReportType.C2C_EXCHANGE, C2C_COLUMNS, rows, {
      transactionCount: rows.length,
      salesValue: rows
        .filter((row) => row.direction === 'SALE')
        .reduce((sum, row) => sum + row.total, 0),
      purchasesValue: rows
        .filter((row) => row.direction === 'PURCHASE')
        .reduce((sum, row) => sum + row.total, 0),
    });
  }

  private async ordersFulfillment(
    context: ReportContext,
    filters: ReportFiltersDto,
  ) {
    const status = this.orderStatus(filters.status);
    const organizationWhere: Prisma.OrderWhereInput =
      context.role === UserRole.SUPPLIER
        ? { supplierId: context.orgId }
        : {
            OR: [
              { pharmacyId: context.orgId },
              { sellerPharmacyId: context.orgId },
            ],
          };
    const orders = await this.prisma.order.findMany({
      where: {
        ...organizationWhere,
        deletedAt: null,
        createdAt: this.dateFilter(filters),
        ...(status ? { status } : {}),
      },
      include: {
        pharmacy: { select: { name: true } },
        supplier: { select: { name: true } },
        sellerPharmacy: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const rows = orders.map((order) => ({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      buyer: order.pharmacy.name,
      seller: order.supplier?.name ?? order.sellerPharmacy?.name ?? '',
      channel: order.supplierId ? 'SUPPLIER' : 'C2C',
      status: order.status,
      itemCount: order._count.items,
      total: this.number(order.totalAmount),
    }));
    const summary: Record<string, number> = {
      orderCount: rows.length,
      orderValue: this.sum(rows, 'total'),
    };
    for (const orderStatus of Object.values(OrderStatus)) {
      summary[`status_${orderStatus.toLowerCase()}`] = rows.filter(
        (row) => row.status === orderStatus,
      ).length;
    }
    return this.result(
      ReportType.ORDERS_FULFILLMENT,
      ORDER_COLUMNS,
      rows,
      summary,
    );
  }

  private async inventoryValue(pharmacyId: string, filters: ReportFiltersDto) {
    const inventory = await this.prisma.inventory.findMany({
      where: {
        pharmacyId,
        deletedAt: null,
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.categoryId
          ? { product: { categoryId: filters.categoryId } }
          : {}),
      },
      include: {
        product: {
          include: { category: { select: { nameAr: true, nameEn: true } } },
        },
      },
      orderBy: [{ productId: 'asc' }, { expiryDate: 'asc' }],
    });
    const rows = inventory.map((item) => {
      const available = item.quantity - item.reservedStock;
      const cost = this.number(item.purchaseCost);
      return {
        productAr: item.product.tradeNameAr,
        productEn: item.product.tradeNameEn,
        categoryAr: item.product.category.nameAr,
        categoryEn: item.product.category.nameEn,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        reserved: item.reservedStock,
        available,
        purchaseCost: cost,
        stockValue: cost * item.quantity,
        availableValue: cost * available,
      };
    });
    return this.result(
      ReportType.INVENTORY_VALUE,
      INVENTORY_VALUE_COLUMNS,
      rows,
      {
        batchCount: rows.length,
        unitsOnHand: this.sum(rows, 'quantity'),
        totalStockValue: this.sum(rows, 'stockValue'),
        availableStockValue: this.sum(rows, 'availableValue'),
      },
    );
  }

  private async inventoryMovements(
    pharmacyId: string,
    filters: ReportFiltersDto,
  ) {
    const movementType = this.movementType(filters.status);
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        pharmacyId,
        createdAt: this.dateFilter(filters),
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(movementType ? { type: movementType } : {}),
      },
      include: {
        inventory: {
          include: {
            product: { select: { tradeNameAr: true, tradeNameEn: true } },
          },
        },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const rows = movements.map((item) => ({
      createdAt: item.createdAt,
      productAr: item.inventory.product.tradeNameAr,
      productEn: item.inventory.product.tradeNameEn,
      batchNumber: item.batchNumber,
      type: item.type,
      difference: item.difference,
      previousQuantity: item.prevQuantity,
      newQuantity: item.newQuantity,
      staff: `${item.user.firstName} ${item.user.lastName}`,
      reference: item.referenceId,
      reason: item.reason,
    }));
    return this.result(ReportType.INVENTORY_MOVEMENTS, MOVEMENT_COLUMNS, rows, {
      movementCount: rows.length,
      inboundUnits: rows
        .filter((row) => row.difference > 0)
        .reduce((sum, row) => sum + row.difference, 0),
      outboundUnits: Math.abs(
        rows
          .filter((row) => row.difference < 0)
          .reduce((sum, row) => sum + row.difference, 0),
      ),
    });
  }

  private async lowStock(pharmacyId: string, filters: ReportFiltersDto) {
    const inventory = await this.prisma.inventory.findMany({
      where: {
        pharmacyId,
        deletedAt: null,
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.categoryId
          ? { product: { categoryId: filters.categoryId } }
          : {}),
      },
      include: {
        product: {
          include: { category: { select: { nameAr: true, nameEn: true } } },
        },
      },
    });
    const grouped = new Map<string, Record<string, ReportCell>>();
    for (const item of inventory) {
      const existing = grouped.get(item.productId);
      if (existing) {
        existing.quantity = Number(existing.quantity) + item.quantity;
        existing.available =
          Number(existing.available) + item.quantity - item.reservedStock;
        existing.minStock = Math.max(Number(existing.minStock), item.minStock);
      } else {
        grouped.set(item.productId, {
          productAr: item.product.tradeNameAr,
          productEn: item.product.tradeNameEn,
          categoryAr: item.product.category.nameAr,
          categoryEn: item.product.category.nameEn,
          quantity: item.quantity,
          available: item.quantity - item.reservedStock,
          minStock: item.minStock,
        });
      }
    }
    const rows = [...grouped.values()]
      .filter((row) => Number(row.available) <= Number(row.minStock))
      .map((row) => ({
        ...row,
        shortage: Math.max(0, Number(row.minStock) - Number(row.available)),
      }));
    return this.result(ReportType.LOW_STOCK, LOW_STOCK_COLUMNS, rows, {
      lowStockProducts: rows.length,
      shortageUnits: this.sum(rows, 'shortage'),
    });
  }

  private async expiry(pharmacyId: string, filters: ReportFiltersDto) {
    const now = new Date();
    const until = new Date(now);
    until.setUTCDate(until.getUTCDate() + (filters.expiryDays ?? 90));
    const inventory = await this.prisma.inventory.findMany({
      where: {
        pharmacyId,
        deletedAt: null,
        quantity: { gt: 0 },
        expiryDate: { lte: until },
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.categoryId
          ? { product: { categoryId: filters.categoryId } }
          : {}),
      },
      include: {
        product: {
          include: { category: { select: { nameAr: true, nameEn: true } } },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
    const rows = inventory.map((item) => {
      const daysRemaining = Math.ceil(
        (item.expiryDate.getTime() - now.getTime()) / 86_400_000,
      );
      return {
        productAr: item.product.tradeNameAr,
        productEn: item.product.tradeNameEn,
        categoryAr: item.product.category.nameAr,
        categoryEn: item.product.category.nameEn,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        daysRemaining,
        quantity: item.quantity,
        stockValue: item.quantity * this.number(item.purchaseCost),
        state: daysRemaining < 0 ? 'EXPIRED' : 'EXPIRING',
      };
    });
    return this.result(ReportType.EXPIRY, EXPIRY_COLUMNS, rows, {
      batchCount: rows.length,
      expiredBatches: rows.filter((row) => row.state === 'EXPIRED').length,
      unitsAtRisk: this.sum(rows, 'quantity'),
      valueAtRisk: this.sum(rows, 'stockValue'),
    });
  }

  private async performance(context: ReportContext, filters: ReportFiltersDto) {
    return context.role === UserRole.PHARMACY
      ? this.pharmacyPerformance(context.orgId, filters)
      : this.supplierPerformance(context.orgId, filters);
  }

  private async pharmacyPerformance(
    pharmacyId: string,
    filters: ReportFiltersDto,
  ) {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          pharmacyId,
          createdAt: this.dateFilter(filters),
          status: { not: SaleStatus.CANCELLED },
        },
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.categoryId
          ? { product: { categoryId: filters.categoryId } }
          : {}),
      },
      include: {
        product: {
          include: {
            category: { select: { id: true, nameAr: true, nameEn: true } },
          },
        },
      },
    });
    return this.aggregatePerformance(
      items.map((item) => ({
        productId: item.productId,
        productAr: item.productNameAr,
        productEn: item.productNameEn,
        categoryId: item.product.category.id,
        categoryAr: item.product.category.nameAr,
        categoryEn: item.product.category.nameEn,
        quantity: item.quantity - item.returnedQuantity,
        revenue: this.number(item.netAmount) - this.number(item.returnedAmount),
        cost:
          item.quantity === 0
            ? 0
            : (this.number(item.costAmount) *
                (item.quantity - item.returnedQuantity)) /
              item.quantity,
      })),
    );
  }

  private async supplierPerformance(
    supplierId: string,
    filters: ReportFiltersDto,
  ) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          supplierId,
          deletedAt: null,
          status: OrderStatus.DELIVERED,
          createdAt: this.dateFilter(filters),
        },
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.categoryId
          ? { supplierProduct: { product: { categoryId: filters.categoryId } } }
          : {}),
      },
      include: {
        supplierProduct: {
          include: {
            product: {
              include: {
                category: { select: { id: true, nameAr: true, nameEn: true } },
              },
            },
          },
        },
      },
    });
    return this.aggregatePerformance(
      items.flatMap((item) => {
        const product = item.supplierProduct?.product;
        if (!product) return [];
        return [
          {
            productId: item.productId,
            productAr: product.tradeNameAr,
            productEn: product.tradeNameEn,
            categoryId: product.category.id,
            categoryAr: product.category.nameAr,
            categoryEn: product.category.nameEn,
            quantity: item.quantity,
            revenue: this.number(item.subtotal),
            cost: 0,
          },
        ];
      }),
    );
  }

  private aggregatePerformance(
    source: Array<{
      productId: string;
      productAr: string;
      productEn: string;
      categoryId: string;
      categoryAr: string;
      categoryEn: string;
      quantity: number;
      revenue: number;
      cost: number;
    }>,
  ) {
    const products = new Map<string, (typeof source)[number]>();
    for (const item of source) {
      const current = products.get(item.productId);
      if (current) {
        current.quantity += item.quantity;
        current.revenue += item.revenue;
        current.cost += item.cost;
      } else {
        products.set(item.productId, { ...item });
      }
    }
    const rows = [...products.values()]
      .map((item) => ({
        productAr: item.productAr,
        productEn: item.productEn,
        categoryAr: item.categoryAr,
        categoryEn: item.categoryEn,
        quantity: item.quantity,
        revenue: item.revenue,
        cost: item.cost,
        margin: item.revenue - item.cost,
      }))
      .sort((a, b) => b.revenue - a.revenue);
    return this.result(
      ReportType.PRODUCT_CATEGORY_PERFORMANCE,
      PERFORMANCE_COLUMNS,
      rows,
      {
        productCount: rows.length,
        units: this.sum(rows, 'quantity'),
        revenue: this.sum(rows, 'revenue'),
        cost: this.sum(rows, 'cost'),
        margin: this.sum(rows, 'margin'),
      },
    );
  }

  private result(
    reportType: ReportType,
    columns: ReportColumn[],
    rows: Array<Record<string, ReportCell>>,
    summary: Record<string, number | string>,
  ): ReportResult {
    return {
      reportType,
      titleAr: TITLES[reportType].ar,
      titleEn: TITLES[reportType].en,
      generatedAt: new Date(),
      columns,
      rows,
      summary,
    };
  }

  private dateFilter(
    filters: ReportFiltersDto,
  ): Prisma.DateTimeFilter | undefined {
    if (!filters.from && !filters.to) return undefined;
    return {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: this.endDate(filters.to) } : {}),
    };
  }

  private endDate(value: string) {
    const date = new Date(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date.setUTCHours(23, 59, 59, 999);
    }
    return date;
  }

  private validateDateRange(filters: ReportFiltersDto) {
    if (
      filters.from &&
      filters.to &&
      new Date(filters.from).getTime() > this.endDate(filters.to).getTime()
    ) {
      throw new BadRequestException('"from" must be before or equal to "to"');
    }
  }

  private orderStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(OrderStatus).includes(value as OrderStatus)) {
      throw new BadRequestException('Invalid order status');
    }
    return value as OrderStatus;
  }

  private saleStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(SaleStatus).includes(value as SaleStatus)) {
      throw new BadRequestException('Invalid sale status');
    }
    return value as SaleStatus;
  }

  private movementType(value?: string) {
    if (!value) return undefined;
    if (!Object.values(MovementType).includes(value as MovementType)) {
      throw new BadRequestException('Invalid inventory movement type');
    }
    return value as MovementType;
  }

  private number(value: Prisma.Decimal | number) {
    return Number(value);
  }

  private sum(rows: Array<Record<string, unknown>>, key: string) {
    return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
  }
}

const col = (
  key: string,
  labelAr: string,
  labelEn: string,
  type: ReportColumn['type'] = 'text',
): ReportColumn => ({ key, labelAr, labelEn, type });

export const TITLES: Record<ReportType, { ar: string; en: string }> = {
  PHARMACY_POS_SALES: { ar: 'مبيعات نقاط البيع', en: 'Pharmacy POS Sales' },
  PHARMACY_POS_RETURNS: {
    ar: 'مرتجعات نقاط البيع',
    en: 'Pharmacy POS Returns',
  },
  SUPPLIER_SALES: { ar: 'مبيعات المورد', en: 'Supplier Sales' },
  C2C_EXCHANGE: { ar: 'مبيعات ومشتريات التبادل', en: 'C2C Sales & Purchases' },
  ORDERS_FULFILLMENT: { ar: 'الطلبات والتنفيذ', en: 'Orders & Fulfillment' },
  INVENTORY_VALUE: { ar: 'قيمة المخزون', en: 'Inventory Value' },
  INVENTORY_MOVEMENTS: { ar: 'حركات المخزون', en: 'Inventory Movements' },
  LOW_STOCK: { ar: 'المخزون المنخفض', en: 'Low Stock' },
  EXPIRY: { ar: 'الصلاحية', en: 'Expiry' },
  PRODUCT_CATEGORY_PERFORMANCE: {
    ar: 'أداء المنتجات والفئات',
    en: 'Product & Category Performance',
  },
};

const POS_SALES_COLUMNS = [
  col('saleNumber', 'رقم البيع', 'Sale #'),
  col('createdAt', 'التاريخ', 'Date', 'date'),
  col('staff', 'الموظف', 'Staff'),
  col('status', 'الحالة', 'Status', 'status'),
  col('itemCount', 'الأصناف', 'Items', 'number'),
  col('subtotal', 'المجموع الفرعي', 'Subtotal', 'money'),
  col('discount', 'الخصم', 'Discount', 'money'),
  col('total', 'الإجمالي', 'Total', 'money'),
  col('paid', 'المدفوع', 'Paid', 'money'),
  col('refunded', 'المسترد', 'Refunded', 'money'),
  col('net', 'الصافي', 'Net', 'money'),
];
const POS_RETURN_COLUMNS = [
  col('returnNumber', 'رقم المرتجع', 'Return #'),
  col('saleNumber', 'رقم البيع', 'Sale #'),
  col('createdAt', 'التاريخ', 'Date', 'date'),
  col('type', 'النوع', 'Type', 'status'),
  col('staff', 'الموظف', 'Staff'),
  col('itemCount', 'الأصناف', 'Items', 'number'),
  col('returnAmount', 'قيمة المرتجع', 'Return Value', 'money'),
  col('refundAmount', 'قيمة الاسترداد', 'Refund Value', 'money'),
  col('reason', 'السبب', 'Reason'),
];
const SUPPLIER_SALES_COLUMNS = [
  col('orderNumber', 'رقم الطلب', 'Order #'),
  col('createdAt', 'التاريخ', 'Date', 'date'),
  col('pharmacy', 'الصيدلية', 'Pharmacy'),
  col('city', 'المدينة', 'City'),
  col('status', 'الحالة', 'Status', 'status'),
  col('paymentStatus', 'حالة الدفع', 'Payment', 'status'),
  col('itemCount', 'الأصناف', 'Items', 'number'),
  col('total', 'الإجمالي', 'Total', 'money'),
];
const C2C_COLUMNS = [
  col('orderNumber', 'رقم الطلب', 'Order #'),
  col('createdAt', 'التاريخ', 'Date', 'date'),
  col('direction', 'الاتجاه', 'Direction', 'status'),
  col('counterparty', 'الطرف المقابل', 'Counterparty'),
  col('status', 'الحالة', 'Status', 'status'),
  col('itemCount', 'الأصناف', 'Items', 'number'),
  col('total', 'الإجمالي', 'Total', 'money'),
];
const ORDER_COLUMNS = [
  col('orderNumber', 'رقم الطلب', 'Order #'),
  col('createdAt', 'تاريخ الإنشاء', 'Created', 'date'),
  col('updatedAt', 'آخر تحديث', 'Updated', 'date'),
  col('buyer', 'المشتري', 'Buyer'),
  col('seller', 'البائع', 'Seller'),
  col('channel', 'القناة', 'Channel', 'status'),
  col('status', 'الحالة', 'Status', 'status'),
  col('itemCount', 'الأصناف', 'Items', 'number'),
  col('total', 'الإجمالي', 'Total', 'money'),
];
const INVENTORY_VALUE_COLUMNS = [
  col('productAr', 'المنتج', 'Product (AR)'),
  col('productEn', 'المنتج بالإنجليزية', 'Product'),
  col('categoryAr', 'الفئة', 'Category (AR)'),
  col('categoryEn', 'الفئة بالإنجليزية', 'Category'),
  col('batchNumber', 'رقم التشغيلة', 'Batch'),
  col('expiryDate', 'الصلاحية', 'Expiry', 'date'),
  col('quantity', 'الكمية', 'Quantity', 'number'),
  col('reserved', 'المحجوز', 'Reserved', 'number'),
  col('available', 'المتاح', 'Available', 'number'),
  col('purchaseCost', 'تكلفة الشراء', 'Unit Cost', 'money'),
  col('stockValue', 'قيمة المخزون', 'Stock Value', 'money'),
  col('availableValue', 'قيمة المتاح', 'Available Value', 'money'),
];
const MOVEMENT_COLUMNS = [
  col('createdAt', 'التاريخ', 'Date', 'date'),
  col('productAr', 'المنتج', 'Product (AR)'),
  col('productEn', 'المنتج بالإنجليزية', 'Product'),
  col('batchNumber', 'رقم التشغيلة', 'Batch'),
  col('type', 'نوع الحركة', 'Movement', 'status'),
  col('difference', 'الفرق', 'Difference', 'number'),
  col('previousQuantity', 'الكمية السابقة', 'Previous', 'number'),
  col('newQuantity', 'الكمية الجديدة', 'New', 'number'),
  col('staff', 'الموظف', 'Staff'),
  col('reference', 'المرجع', 'Reference'),
  col('reason', 'السبب', 'Reason'),
];
const LOW_STOCK_COLUMNS = [
  col('productAr', 'المنتج', 'Product (AR)'),
  col('productEn', 'المنتج بالإنجليزية', 'Product'),
  col('categoryAr', 'الفئة', 'Category (AR)'),
  col('categoryEn', 'الفئة بالإنجليزية', 'Category'),
  col('quantity', 'الكمية', 'Quantity', 'number'),
  col('available', 'المتاح', 'Available', 'number'),
  col('minStock', 'الحد الأدنى', 'Minimum', 'number'),
  col('shortage', 'العجز', 'Shortage', 'number'),
];
const EXPIRY_COLUMNS = [
  col('productAr', 'المنتج', 'Product (AR)'),
  col('productEn', 'المنتج بالإنجليزية', 'Product'),
  col('categoryAr', 'الفئة', 'Category (AR)'),
  col('categoryEn', 'الفئة بالإنجليزية', 'Category'),
  col('batchNumber', 'رقم التشغيلة', 'Batch'),
  col('expiryDate', 'الصلاحية', 'Expiry', 'date'),
  col('daysRemaining', 'الأيام المتبقية', 'Days', 'number'),
  col('quantity', 'الكمية', 'Quantity', 'number'),
  col('stockValue', 'القيمة المعرضة', 'Value at Risk', 'money'),
  col('state', 'الحالة', 'State', 'status'),
];
const PERFORMANCE_COLUMNS = [
  col('productAr', 'المنتج', 'Product (AR)'),
  col('productEn', 'المنتج بالإنجليزية', 'Product'),
  col('categoryAr', 'الفئة', 'Category (AR)'),
  col('categoryEn', 'الفئة بالإنجليزية', 'Category'),
  col('quantity', 'الكمية', 'Quantity', 'number'),
  col('revenue', 'الإيراد', 'Revenue', 'money'),
  col('cost', 'التكلفة', 'Cost', 'money'),
  col('margin', 'الهامش', 'Margin', 'money'),
];
