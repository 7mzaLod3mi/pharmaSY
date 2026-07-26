import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Helper for soft delete queries — filters out records with deletedAt set
   */
  async cleanDb() {
    if (process.env.NODE_ENV === 'test') {
      // Used in test setup only
      await this.$transaction([
        this.auditLog.deleteMany(),
        this.inventoryMovement.deleteMany(),
        this.inventory.deleteMany(),
        this.orderItem.deleteMany(),
        this.order.deleteMany(),
        this.checkoutGroup.deleteMany(),
        this.supplierProduct.deleteMany(),
        this.product.deleteMany(),
        this.category.deleteMany(),
        this.manufacturer.deleteMany(),
        this.notification.deleteMany(),
        this.favorite.deleteMany(),
        this.pharmacy.deleteMany(),
        this.supplier.deleteMany(),
        this.refreshToken.deleteMany(),
        this.emailVerification.deleteMany(),
        this.passwordReset.deleteMany(),
        this.user.deleteMany(),
      ]);
    }
  }
}
