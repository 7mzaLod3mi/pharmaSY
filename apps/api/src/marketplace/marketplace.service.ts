import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async searchProducts(query?: string) {
    const productWhere: any = {
      status: 'ACTIVE',
      ...(query ? {
        OR: [
          { tradeNameEn: { contains: query, mode: 'insensitive' } },
          { tradeNameAr: { contains: query, mode: 'insensitive' } },
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
    ].sort((a, b) => Number(a.price) - Number(b.price));

    return {
      data,
      meta: { total: data.length, page: 1, limit: data.length }
    };
  }
}
