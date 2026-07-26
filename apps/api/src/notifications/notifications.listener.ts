import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '@prisma/client';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('order.created', { async: true })
  async handleOrderCreated(payload: {
    order: { id: string; orderNumber: string };
    sellerUserId: string;
    pharmacyName: string;
    actionUrl: string;
  }) {
    this.logger.debug(
      `Handling order.created event for order ${payload.order.orderNumber}`,
    );

    await this.notificationsService.create({
      userId: payload.sellerUserId,
      type: NotificationType.ORDER_CREATED,
      category: NotificationCategory.ORDERS,
      priority: NotificationPriority.HIGH,
      eventId: `order-created-${payload.order.id}`,
      actionUrl: payload.actionUrl,
      entityType: 'Order',
      entityId: payload.order.id,
      templateData: {
        orderNumber: payload.order.orderNumber,
        pharmacyName: payload.pharmacyName,
      },
    });
  }

  @OnEvent('order.status_changed', { async: true })
  async handleOrderStatusChanged(payload: {
    order: { id: string; orderNumber: string };
    recipientUserId: string;
    actionUrl: string;
    newStatus: string;
  }) {
    this.logger.debug(
      `Handling order.status_changed event for order ${payload.order.orderNumber} to ${payload.newStatus}`,
    );

    let type: NotificationType | null = null;
    if (payload.newStatus === 'CONFIRMED')
      type = NotificationType.ORDER_ACCEPTED;
    if (payload.newStatus === 'CANCELLED')
      type = NotificationType.ORDER_REJECTED;
    if (payload.newStatus === 'DELIVERED')
      type = NotificationType.ORDER_DELIVERED;

    if (!type) return;

    await this.notificationsService.create({
      userId: payload.recipientUserId,
      type,
      category: NotificationCategory.ORDERS,
      priority: NotificationPriority.NORMAL,
      eventId: `order-status-${payload.order.id}-${payload.newStatus}`,
      actionUrl: payload.actionUrl,
      entityType: 'Order',
      entityId: payload.order.id,
      templateData: {
        orderNumber: payload.order.orderNumber,
      },
    });
  }

  @OnEvent('marketplace.purchase', { async: true })
  async handleMarketplacePurchase(payload: {
    offer: { id: string };
    sellerUserId: string;
    quantity: number;
    productName: string;
  }) {
    await this.notificationsService.create({
      userId: payload.sellerUserId,
      type: NotificationType.MARKETPLACE_SALE,
      category: NotificationCategory.MARKETPLACE,
      eventId: `marketplace-sale-${payload.offer.id}-${Date.now()}`,
      actionUrl: '/pharmacy/exchange',
      entityType: 'MarketplaceOffer',
      entityId: payload.offer.id,
      templateData: {
        quantity: payload.quantity,
        productName: payload.productName,
      },
    });
  }

  @OnEvent('inventory.low_stock', { async: true })
  async handleLowStock(payload: {
    inventory: { id: string; quantity: number; minStock: number };
    userId: string;
    productName: string;
  }) {
    await this.notificationsService.create({
      userId: payload.userId,
      type: NotificationType.LOW_STOCK,
      category: NotificationCategory.INVENTORY,
      priority: NotificationPriority.HIGH,
      eventId: `inventory-low-${payload.inventory.id}-${Date.now()}`,
      actionUrl: '/pharmacy/inventory/alerts/low-stock',
      entityType: 'Inventory',
      entityId: payload.inventory.id,
      templateData: {
        productName: payload.productName,
        quantity: payload.inventory.quantity,
        minStock: payload.inventory.minStock,
      },
    });
  }
}
