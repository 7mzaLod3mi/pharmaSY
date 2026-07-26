import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface QuantityDiscountTier {
  minQuantity: number;
  unitPrice: number;
}

export interface UpsertSupplierProductDto {
  productId: string;
  price: number;
  stock: number;
  minOrder?: number;
  expiryDate: string;
  notes?: string;
  isAvailable?: boolean;
  batchNumber: string;
  quantityDiscounts?: QuantityDiscountTier[];
}

export interface UpdateSupplierProductDto {
  price?: number;
  stock?: number;
  minOrder?: number;
  expiryDate?: string;
  notes?: string;
  isAvailable?: boolean;
  batchNumber?: string;
  quantityDiscounts?: QuantityDiscountTier[];
}

export interface SupplierProductsQuery {
  supplierId?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class SupplierProductsService {
  constructor(private prisma: PrismaService) {}

  async findBySupplierId(supplierId: string, query: SupplierProductsQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierProductWhereInput = { supplierId };
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;

    const [data, total] = await Promise.all([
      this.prisma.supplierProduct.findMany({
        where,
        include: {
          product: {
            include: {
              category: { select: { nameAr: true, nameEn: true } },
              manufacturer: { select: { name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.supplierProduct.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async upsert(supplierId: string, dto: UpsertSupplierProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'ACTIVE')
      throw new ConflictException(
        'Cannot create offers for non-active products',
      );
    this.validateSellableOffer({
      stock: dto.stock,
      isAvailable: dto.isAvailable ?? true,
      batchNumber: dto.batchNumber,
      expiryDate: new Date(dto.expiryDate),
    });
    this.validateQuantityDiscounts(dto.price, dto.quantityDiscounts);

    return this.prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId, productId: dto.productId } },
      create: {
        supplierId,
        productId: dto.productId,
        price: dto.price,
        stock: dto.stock,
        minOrder: dto.minOrder || 1,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
        isAvailable: dto.isAvailable ?? true,
        batchNumber: dto.batchNumber,
        quantityDiscounts: dto.quantityDiscounts as
          Prisma.InputJsonValue | undefined,
      },
      update: {
        price: dto.price,
        stock: dto.stock,
        minOrder: dto.minOrder,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
        isAvailable: dto.isAvailable,
        batchNumber: dto.batchNumber,
        quantityDiscounts: dto.quantityDiscounts as
          Prisma.InputJsonValue | undefined,
      },
      include: { product: true },
    });
  }

  async update(supplierId: string, id: string, dto: UpdateSupplierProductDto) {
    const sp = await this.prisma.supplierProduct.findUnique({ where: { id } });
    if (!sp) throw new NotFoundException('Supplier product not found');
    if (sp.supplierId !== supplierId)
      throw new ForbiddenException('Not your product');
    const effectiveExpiry = dto.expiryDate
      ? new Date(dto.expiryDate)
      : sp.expiryDate;
    this.validateSellableOffer({
      stock: dto.stock ?? sp.stock,
      isAvailable: dto.isAvailable ?? sp.isAvailable,
      batchNumber: dto.batchNumber ?? sp.batchNumber,
      expiryDate: effectiveExpiry,
    });
    this.validateQuantityDiscounts(
      dto.price ?? Number(sp.price),
      dto.quantityDiscounts,
    );

    return this.prisma.supplierProduct.update({
      where: { id },
      data: {
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
        ...(dto.minOrder !== undefined ? { minOrder: dto.minOrder } : {}),
        ...(dto.expiryDate ? { expiryDate: new Date(dto.expiryDate) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.isAvailable !== undefined
          ? { isAvailable: dto.isAvailable }
          : {}),
        ...(dto.batchNumber !== undefined
          ? { batchNumber: dto.batchNumber }
          : {}),
        ...(dto.quantityDiscounts !== undefined
          ? {
              quantityDiscounts:
                dto.quantityDiscounts as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
      include: { product: true },
    });
  }

  async remove(supplierId: string, id: string) {
    const sp = await this.prisma.supplierProduct.findUnique({ where: { id } });
    if (!sp) throw new NotFoundException('Supplier product not found');
    if (sp.supplierId !== supplierId)
      throw new ForbiddenException('Not your product');
    return this.prisma.supplierProduct.delete({ where: { id } });
  }

  private validateSellableOffer(input: {
    stock: number;
    isAvailable: boolean;
    batchNumber?: string | null;
    expiryDate?: Date | null;
  }) {
    if (!input.isAvailable || input.stock === 0) return;
    if (!input.batchNumber?.trim()) {
      throw new BadRequestException(
        'Batch number is required for an available offer with stock',
      );
    }
    if (!input.expiryDate || Number.isNaN(input.expiryDate.getTime())) {
      throw new BadRequestException(
        'Expiry date is required for an available offer with stock',
      );
    }
    if (input.expiryDate <= new Date()) {
      throw new BadRequestException('Expired stock cannot be offered');
    }
  }

  private validateQuantityDiscounts(
    basePrice: number,
    tiers?: QuantityDiscountTier[],
  ) {
    if (!tiers?.length) return;
    let previousMinimum = 0;
    for (const tier of tiers) {
      if (tier.minQuantity <= previousMinimum) {
        throw new BadRequestException(
          'Quantity discount tiers must be ordered by increasing minimum quantity',
        );
      }
      if (tier.unitPrice > basePrice) {
        throw new BadRequestException(
          'A quantity discount price cannot exceed the base price',
        );
      }
      previousMinimum = tier.minQuantity;
    }
  }
}
