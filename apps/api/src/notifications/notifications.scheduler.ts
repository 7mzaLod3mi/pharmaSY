import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationCategory, NotificationPriority, DigestFrequency, NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiryAlerts() {
    this.logger.debug('Running daily expiry alerts check...');
    const targetDays = [30, 14, 7, 3, 1, 0];
    
    for (const days of targetDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const expiringInventory = await this.prisma.inventory.findMany({
        where: {
          expiryDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          deletedAt: null,
        },
        include: { product: true },
      });

      for (const item of expiringInventory) {
        // Find users in the pharmacy to notify (simplified to pharmacy owner)
        const pharmacy = await this.prisma.pharmacy.findUnique({
          where: { id: item.pharmacyId },
          select: { userId: true },
        });

        if (pharmacy) {
          await this.notificationsService.create({
            userId: pharmacy.userId,
            type: NotificationType.EXPIRY_ALERT,
            category: NotificationCategory.INVENTORY,
            priority: days <= 7 ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
            eventId: `expiry-${item.id}-${days}days`,
            entityType: 'Inventory',
            entityId: item.id,
            actionUrl: `/inventory/${item.id}`,
            templateData: {
              productName: item.product.tradeNameAr, // Prefer Ar or En based on settings
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate.toISOString().split('T')[0],
            },
          });
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleLowStockAlerts() {
    this.logger.debug('Running daily low-stock alerts check...');
    const inventory = await this.prisma.inventory.findMany({
      where: {
        deletedAt: null,
        pharmacy: { status: 'APPROVED' },
      },
      include: {
        product: { select: { tradeNameAr: true, tradeNameEn: true } },
        pharmacy: { select: { userId: true } },
      },
    });

    const grouped = new Map<
      string,
      {
        pharmacyId: string;
        userId: string;
        productId: string;
        productName: string;
        available: number;
        minStock: number;
      }
    >();
    for (const batch of inventory) {
      const key = `${batch.pharmacyId}:${batch.productId}`;
      const current = grouped.get(key) || {
        pharmacyId: batch.pharmacyId,
        userId: batch.pharmacy.userId,
        productId: batch.productId,
        productName: batch.product.tradeNameAr || batch.product.tradeNameEn,
        available: 0,
        minStock: 0,
      };
      current.available += batch.quantity - batch.reservedStock;
      current.minStock = Math.max(current.minStock, batch.minStock);
      grouped.set(key, current);
    }

    const dateKey = new Date().toISOString().slice(0, 10);
    for (const item of grouped.values()) {
      if (item.available > item.minStock) continue;
      await this.notificationsService.create({
        userId: item.userId,
        type: NotificationType.LOW_STOCK,
        category: NotificationCategory.INVENTORY,
        priority: NotificationPriority.HIGH,
        eventId: `low-stock-${item.pharmacyId}-${item.productId}-${dateKey}`,
        entityType: 'Product',
        entityId: item.productId,
        actionUrl: `/inventory?productId=${item.productId}`,
        templateData: {
          productName: item.productName,
          quantity: item.available,
          minStock: item.minStock,
        },
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateDailyDigests() {
    this.logger.debug('Running daily digest generation...');
    
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { digestFrequency: DigestFrequency.DAILY },
    });

    for (const pref of prefs) {
      // In a real scenario, aggregate unread notifications of the past 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const unreadCount = await this.prisma.notification.count({
        where: {
          userId: pref.userId,
          isRead: false,
          createdAt: { gte: yesterday },
        },
      });

      if (unreadCount > 0) {
        await this.notificationsService.create({
          userId: pref.userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.NORMAL,
          eventId: `daily-digest-${pref.userId}-${new Date().toISOString().split('T')[0]}`,
          templateData: {
            titleAr: 'الملخص اليومي',
            titleEn: 'Daily Digest',
            bodyAr: `لديك ${unreadCount} إشعارات جديدة منذ الأمس.`,
            bodyEn: `You have ${unreadCount} new notifications since yesterday.`,
          },
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredNotifications() {
    this.logger.debug('Cleaning up expired notifications...');
    
    const result = await this.prisma.notification.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired notifications.`);
  }
}
