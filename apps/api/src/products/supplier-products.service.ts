import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface UpsertSupplierProductDto {
  productId: string;
  price: number;
  stock: number;
  minOrder?: number;
  expiryDate?: string;
  notes?: string;
  isAvailable?: boolean;
}

export interface UpdateSupplierProductDto {
  price?: number;
  stock?: number;
  minOrder?: number;
  expiryDate?: string;
  notes?: string;
  isAvailable?: boolean;
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

    const where: any = { supplierId };
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
    if (product.status !== 'ACTIVE') throw new ConflictException('Cannot create offers for non-active products');

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
      },
      update: {
        price: dto.price,
        stock: dto.stock,
        minOrder: dto.minOrder,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
        isAvailable: dto.isAvailable,
      },
      include: { product: true },
    });
  }

  async update(supplierId: string, id: string, dto: UpdateSupplierProductDto) {
    const sp = await this.prisma.supplierProduct.findUnique({ where: { id } });
    if (!sp) throw new NotFoundException('Supplier product not found');
    if (sp.supplierId !== supplierId) throw new ForbiddenException('Not your product');

    return this.prisma.supplierProduct.update({
      where: { id },
      data: {
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
        ...(dto.minOrder !== undefined ? { minOrder: dto.minOrder } : {}),
        ...(dto.expiryDate ? { expiryDate: new Date(dto.expiryDate) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
      },
      include: { product: true },
    });
  }

  async remove(supplierId: string, id: string) {
    const sp = await this.prisma.supplierProduct.findUnique({ where: { id } });
    if (!sp) throw new NotFoundException('Supplier product not found');
    if (sp.supplierId !== supplierId) throw new ForbiddenException('Not your product');
    return this.prisma.supplierProduct.delete({ where: { id } });
  }
}
