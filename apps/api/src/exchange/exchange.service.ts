import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketplaceOfferDto } from './dto/create-offer.dto';

@Injectable()
export class ExchangeService {
  constructor(private prisma: PrismaService) {}

  async publishOffer(pharmacyId: string, dto: CreateMarketplaceOfferDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find Inventory Batch and lock it to prevent concurrent publishing oversell
      let inventory;
      if (dto.batchNumber) {
        const batches: any[] = await tx.$queryRaw`
          SELECT * FROM "inventory" 
          WHERE "pharmacyId" = ${pharmacyId} 
            AND "productId" = ${dto.productId} 
            AND "batchNumber" = ${dto.batchNumber} 
            AND "deletedAt" IS NULL 
          FOR UPDATE
        `;
        inventory = batches[0];
      } else {
        // Find nearest expiring batch that has enough available stock
        const batches: any[] = await tx.$queryRaw`
          SELECT * FROM "inventory" 
          WHERE "pharmacyId" = ${pharmacyId} 
            AND "productId" = ${dto.productId} 
            AND "deletedAt" IS NULL 
            AND ("quantity" - "reservedStock") >= ${dto.quantity}
          ORDER BY "expiryDate" ASC
          FOR UPDATE
        `;
        inventory = batches[0];
      }

      if (!inventory || inventory.deletedAt) {
        throw new NotFoundException('Suitable inventory batch not found for this product');
      }

      const availableStock = inventory.quantity - inventory.reservedStock;
      if (availableStock < dto.quantity) {
        throw new BadRequestException(`Insufficient available stock. Available: ${availableStock}`);
      }

      // 2. Reserve Stock
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedStock: { increment: dto.quantity } },
      });

      // 3. Create MarketplaceOffer
      const offer = await tx.marketplaceOffer.create({
        data: {
          pharmacyId,
          productId: dto.productId,
          originalInventoryId: inventory.id,
          price: dto.price,
          publishedQuantity: dto.quantity,
          expiryDate: inventory.expiryDate, // Use actual batch expiry
          batchNumber: inventory.batchNumber, // Use actual batch number
          notes: dto.notes,
          status: 'ACTIVE',
        },
      });

      // 4. Log Movement
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          productId: inventory.productId,
          pharmacyId: inventory.pharmacyId,
          batchNumber: inventory.batchNumber,
          type: 'OFFER_PUBLISHED',
          quantity: dto.quantity,
          prevQuantity: inventory.quantity, // Quantity doesn't change physically, just reserved
          newQuantity: inventory.quantity,
          difference: 0,
          reason: `Published offer ${offer.id}`,
          marketplaceOfferId: offer.id,
          userId,
        }
      });

      return offer;
    });
  }

  async cancelOffer(pharmacyId: string, offerId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.marketplaceOffer.findFirst({
        where: { id: offerId, pharmacyId },
        include: { originalInventory: true }
      });

      if (!offer) {
        throw new NotFoundException('Marketplace offer not found');
      }

      if (offer.status === 'CANCELLED' || offer.status === 'EXPIRED') {
        throw new BadRequestException(`Offer is already ${offer.status}`);
      }

      const remainingQuantity = offer.publishedQuantity - offer.soldQuantity;

      if (remainingQuantity > 0) {
        // Unreserve the remaining stock
        await tx.inventory.update({
          where: { id: offer.originalInventoryId },
          data: {
            reservedStock: { decrement: remainingQuantity },
          },
        });

        // Log Movement
        await tx.inventoryMovement.create({
          data: {
            inventoryId: offer.originalInventoryId,
            productId: offer.productId,
            pharmacyId: offer.pharmacyId,
            batchNumber: offer.batchNumber || '',
            type: 'OFFER_CANCELLED',
            quantity: remainingQuantity,
            prevQuantity: offer.originalInventory.quantity,
            newQuantity: offer.originalInventory.quantity,
            difference: 0,
            reason: `Cancelled offer ${offer.id}`,
            marketplaceOfferId: offer.id,
            userId,
          }
        });
      }

      return tx.marketplaceOffer.update({
        where: { id: offer.id },
        data: { status: 'CANCELLED' },
      });
    });
  }
}
