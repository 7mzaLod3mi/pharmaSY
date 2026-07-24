import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async searchProducts(
    query?: string,
    categoryId?: string,
    limit = 50,
    productId?: string,
  ) {
    const normalizedQuery = query?.trim().slice(0, 160);
    const boundedLimit = Math.min(100, Math.max(1, Math.trunc(limit) || 50));
    const productWhere: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
      ...(productId ? { id: productId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(normalizedQuery ? {
        OR: [
          { tradeNameEn: { contains: normalizedQuery, mode: 'insensitive' } },
          { tradeNameAr: { contains: normalizedQuery, mode: 'insensitive' } },
          { barcode: { contains: normalizedQuery, mode: 'insensitive' } },
        ]
      } : {})
    };

    const [supplierOffers, pharmacyOffers] = await Promise.all([
      this.prisma.supplierProduct.findMany({
        where: {
          isAvailable: true,
          product: productWhere
        },
        include: {
          product: true,
          supplier: { select: { id: true, name: true } }
        },
        take: boundedLimit,
      }),
      this.prisma.marketplaceOffer.findMany({
        where: {
          status: 'ACTIVE',
          product: productWhere
        },
        include: {
          product: true,
          pharmacy: { select: { id: true, name: true } }
        },
        take: boundedLimit,
      })
    ]);

    const data = [
      ...supplierOffers.map(o => ({ ...o, offerType: 'SUPPLIER' })),
      ...pharmacyOffers.map(o => ({
        id: o.id,
        offerType: 'PHARMACY',
        productId: o.productId,
        product: o.product,
        price: o.price,
        stock: o.publishedQuantity - o.soldQuantity,
        minOrder: 1,
        expiryDate: o.expiryDate,
        batchNumber: o.batchNumber,
        isAvailable: o.status === 'ACTIVE' && (o.publishedQuantity - o.soldQuantity > 0),
        notes: o.notes,
        supplierId: o.pharmacyId, // mapped for frontend compatibility
        supplier: { id: o.pharmacy.id, name: o.pharmacy.name }
      }))
    ]
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, boundedLimit);

    return {
      data,
      meta: { total: data.length, page: 1, limit: boundedLimit }
    };
  }
}
