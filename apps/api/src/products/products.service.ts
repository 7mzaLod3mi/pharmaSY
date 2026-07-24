import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { ProductStatus } from '@pharmasyn/types';

export interface CreateProductDto {
  tradeNameAr: string;
  tradeNameEn: string;
  scientificName?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  barcode?: string;
  categoryId: string;
  manufacturerId?: string;
  imageUrl?: string;
  unit: string;
  description?: string;
}

export interface UpdateProductDto {
  tradeNameAr?: string;
  tradeNameEn?: string;
  scientificName?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  barcode?: string;
  categoryId?: string;
  manufacturerId?: string;
  imageUrl?: string;
  unit?: string;
  description?: string;
  status?: ProductStatus;
}

export interface ProductsQuery {
  search?: string;
  categoryId?: string;
  manufacturerId?: string;
  barcode?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductsQuery, userRole?: string) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    
    // Only admins can see non-active products in general search (if they choose to)
    // Actually, force ACTIVE for non-admins
    if (userRole !== 'ADMIN') {
      where.status = 'ACTIVE';
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.manufacturerId) where.manufacturerId = query.manufacturerId;
    if (query.barcode) where.barcode = query.barcode;

    if (query.search) {
      where.OR = [
        { tradeNameAr: { contains: query.search, mode: 'insensitive' } },
        { tradeNameEn: { contains: query.search, mode: 'insensitive' } },
        { scientificName: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          manufacturer: { select: { id: true, name: true, country: true, logoUrl: true } },
          _count: { select: { supplierProducts: true } },
        },
        skip,
        take: limit,
        orderBy: { tradeNameAr: 'asc' },
      }),
      this.prisma.product.count({ where }),
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

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        manufacturer: true,
        supplierProducts: {
          where: { isAvailable: true, supplier: { status: 'APPROVED' } },
          include: {
            supplier: {
              select: { id: true, name: true, city: true, phone: true, logoUrl: true },
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode, deletedAt: null },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
        manufacturer: { select: { id: true, name: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found for barcode: ' + barcode);
    return product;
  }

  async create(dto: CreateProductDto, userId: string) {
    if (dto.barcode) {
      const existing = await this.prisma.product.findUnique({ where: { barcode: dto.barcode } });
      if (existing) throw new ConflictException('Barcode already exists');
    }
    return this.prisma.product.create({
      data: {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      }
    });
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    await this.findById(id);
    if (dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: { barcode: dto.barcode, id: { not: id } },
      });
      if (existing) throw new ConflictException('Barcode already in use');
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
        version: { increment: 1 }
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        updatedBy: userId,
        version: { increment: 1 }
      },
    });
  }
}
