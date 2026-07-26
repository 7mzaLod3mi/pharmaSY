import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationChannel,
  Notification,
  Prisma,
} from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
import { AuditService } from '../audit/audit.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationTemplate, TemplateData } from './notification.template';
import type {
  NotificationQueryDto,
  UpdateNotificationPreferencesDto,
} from './dto/notifications.dto';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  eventId?: string; // For idempotency
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  templateData: TemplateData;
  expiresAt?: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    @InjectQueue('email-queue') private emailQueue: Queue,
    private auditService: AuditService,
  ) {}

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updatePreferences(
    userId: string,
    data: UpdateNotificationPreferencesDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async findAll(userId: string, query: NotificationQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }, // Exclude expired
      ],
    };

    if (query.category) where.category = query.category;
    if (query.isRead !== undefined) where.isRead = query.isRead;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string, userRole: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    await this.auditService.log({
      entityType: 'Notification',
      entityId: notificationId,
      action: 'READ',
      userId,
      userRole,
    });

    return updated;
  }

  async markAllAsRead(userId: string, userRole: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });

    await this.auditService.log({
      entityType: 'Notification',
      entityId: 'ALL',
      action: 'MARK_ALL_READ',
      userId,
      userRole,
    });

    return { count: result.count };
  }

  async create(dto: CreateNotificationDto) {
    // 1. Idempotency Check
    if (dto.eventId) {
      const existing = await this.prisma.notification.findUnique({
        where: { eventId: dto.eventId },
      });
      if (existing) {
        this.logger.debug(
          `Idempotency hit: Ignored duplicate eventId ${dto.eventId}`,
        );
        return existing;
      }
    }

    // 2. Preferences Check
    const prefs = await this.getPreferences(dto.userId);

    // Check if category is enabled
    const categoryKey = this.mapCategoryToPref(dto.category);
    if (categoryKey && prefs[categoryKey] === false) {
      this.logger.debug(
        `Notification ignored: Category ${dto.category} disabled by user ${dto.userId}`,
      );
      return null;
    }

    // 3. Template Resolution
    let content = NotificationTemplate.generate(dto.type, dto.templateData);

    // 4. Aggregation (Anti-Spam)
    // If it's a LOW_STOCK for example, and there's a recent unread LOW_STOCK notification, we can aggregate.
    if (dto.type === NotificationType.LOW_STOCK) {
      const recent = await this.prisma.notification.findFirst({
        where: {
          userId: dto.userId,
          type: NotificationType.LOW_STOCK,
          isRead: false,
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last 1 hour
        },
      });

      if (recent) {
        // Aggregate
        const metadata =
          recent.metadata &&
          typeof recent.metadata === 'object' &&
          !Array.isArray(recent.metadata)
            ? recent.metadata
            : {};
        const currentCount = Number(metadata.aggregatedCount) || 1;
        const newCount = currentCount + 1;

        content = {
          titleAr: 'تنبيه: مخزون منخفض',
          titleEn: 'Low Stock Alert',
          bodyAr: `يوجد ${newCount} منتجات وصل مخزونها للحد الأدنى.`,
          bodyEn: `${newCount} products require your attention due to low stock.`,
        };

        const updated = await this.prisma.notification.update({
          where: { id: recent.id },
          data: {
            titleAr: content.titleAr,
            titleEn: content.titleEn,
            bodyAr: content.bodyAr,
            bodyEn: content.bodyEn,
            metadata: { ...metadata, aggregatedCount: newCount },
          },
        });

        this.gateway.emitToUser(dto.userId, 'notification:updated', updated);
        return updated;
      }
    }

    // 5. Creation
    const channels: NotificationChannel[] = [];
    if (prefs.inAppEnabled) channels.push(NotificationChannel.IN_APP);
    if (prefs.emailEnabled) channels.push(NotificationChannel.EMAIL);

    if (channels.length === 0) {
      return null; // User disabled all channels
    }

    let notification: Notification;
    try {
      notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          category: dto.category,
          priority: dto.priority || NotificationPriority.NORMAL,
          eventId: dto.eventId,
          titleAr: content.titleAr,
          titleEn: content.titleEn,
          bodyAr: content.bodyAr,
          bodyEn: content.bodyEn,
          actionUrl: dto.actionUrl,
          entityType: dto.entityType,
          entityId: dto.entityId,
          metadata: dto.metadata,
          channels,
          expiresAt: dto.expiresAt,
        },
      });
    } catch (error) {
      if (
        dto.eventId &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.notification.findUnique({
          where: { eventId: dto.eventId },
        });
        if (existing) return existing;
      }
      throw error;
    }

    // 6. Dispatch to Channels
    if (channels.includes(NotificationChannel.IN_APP)) {
      this.gateway.emitToUser(dto.userId, 'notification:new', notification);
    }

    if (channels.includes(NotificationChannel.EMAIL)) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (user?.email) {
        await this.emailQueue.add('send-email', {
          to: user.email,
          subject: content.titleEn, // Could use i18n based on user preference later
          html: `<div dir="auto"><h2>${this.escapeHtml(content.titleAr)} / ${this.escapeHtml(content.titleEn)}</h2><p>${this.escapeHtml(content.bodyAr)}</p><p>${this.escapeHtml(content.bodyEn)}</p></div>`,
        });
      }
    }

    // Audit Log for Creation
    await this.auditService.log({
      entityType: 'Notification',
      entityId: notification.id,
      action: 'CREATED',
      userId: undefined,
      userRole: 'SYSTEM',
      newValues: { type: dto.type, channels },
    });

    return notification;
  }

  async delete(userId: string, notificationId: string, userRole: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      entityType: 'Notification',
      entityId: notificationId,
      action: 'DELETE',
      userId,
      userRole,
    });

    return updated;
  }

  private mapCategoryToPref(
    category: NotificationCategory,
  ):
    | 'orders'
    | 'marketplace'
    | 'inventory'
    | 'pharmacyExchange'
    | 'productRequests'
    | 'adminApproval'
    | 'system'
    | 'marketing' {
    const map = {
      [NotificationCategory.ORDERS]: 'orders',
      [NotificationCategory.MARKETPLACE]: 'marketplace',
      [NotificationCategory.INVENTORY]: 'inventory',
      [NotificationCategory.PHARMACY_EXCHANGE]: 'pharmacyExchange',
      [NotificationCategory.PRODUCT_REQUESTS]: 'productRequests',
      [NotificationCategory.ADMIN_APPROVAL]: 'adminApproval',
      [NotificationCategory.SYSTEM]: 'system',
      [NotificationCategory.MARKETING]: 'marketing',
    } satisfies Record<
      NotificationCategory,
      | 'orders'
      | 'marketplace'
      | 'inventory'
      | 'pharmacyExchange'
      | 'productRequests'
      | 'adminApproval'
      | 'system'
      | 'marketing'
    >;
    return map[category];
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
