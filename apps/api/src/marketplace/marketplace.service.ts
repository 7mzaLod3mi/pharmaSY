import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async searchProducts(
    query?: string,
    categoryId?: string,
    limit = 50,
    productId?: string,
    excludePharmacyId?: string,
  ) {
    const now = new Date();
    const exchangeEnabled =
      this.configService.get<string>(
        'EXCHANGE_MARKETPLACE_ENABLED',
        'false',
      ) === 'true';
    const normalizedQuery = query?.trim().slice(0, 160);
    const boundedLimit = Math.min(100, Math.max(1, Math.trunc(limit) || 50));
    const productWhere: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
      ...(productId ? { id: productId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(normalizedQuery
        ? {
            OR: [
              {
                tradeNameEn: { contains: normalizedQuery, mode: 'insensitive' },
              },
              {
                tradeNameAr: { contains: normalizedQuery, mode: 'insensitive' },
              },
              { barcode: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [supplierOffers, pharmacyOffers] = await Promise.all([
      this.prisma.supplierProduct.findMany({
        where: {
          isAvailable: true,
          stock: { gt: 0 },
          batchNumber: { not: null },
          expiryDate: { gt: now },
          supplier: { status: 'APPROVED' },
          product: productWhere,
        },
        include: {
          product: true,
          supplier: { select: { id: true, name: true } },
        },
        take: boundedLimit,
      }),
      exchangeEnabled
        ? this.prisma.marketplaceOffer.findMany({
            where: {
              status: 'ACTIVE',
              pharmacyId: excludePharmacyId
                ? { not: excludePharmacyId }
                : undefined,
              expiryDate: { gt: now },
              pharmacy: { status: 'APPROVED' },
              product: productWhere,
            },
            include: {
              product: true,
              pharmacy: { select: { id: true, name: true } },
            },
            take: boundedLimit,
          })
        : Promise.resolve([]),
    ]);

    const data = [
      ...supplierOffers.map((o) => ({ ...o, offerType: 'SUPPLIER' })),
      ...pharmacyOffers
        .filter((o) => o.publishedQuantity - o.soldQuantity > 0)
        .map((o) => ({
          id: o.id,
          offerType: 'PHARMACY',
          productId: o.productId,
          product: o.product,
          price: o.price,
          stock: o.publishedQuantity - o.soldQuantity,
          minOrder: 1,
          expiryDate: o.expiryDate,
          batchNumber: o.batchNumber,
          isAvailable:
            o.status === 'ACTIVE' && o.publishedQuantity - o.soldQuantity > 0,
          notes: o.notes,
          supplierId: o.pharmacyId, // mapped for frontend compatibility
          supplier: { id: o.pharmacy.id, name: o.pharmacy.name },
        })),
    ]
      .sort((a, b) => {
        if (a.offerType !== b.offerType) {
          return a.offerType === 'SUPPLIER' ? -1 : 1;
        }
        return Number(a.price) - Number(b.price);
      })
      .slice(0, boundedLimit);

    return {
      data,
      meta: { total: data.length, page: 1, limit: boundedLimit },
    };
  }
}
