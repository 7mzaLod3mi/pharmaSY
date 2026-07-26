import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '@pharmasyn/types';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permissions } from '../common/permissions';
import {
  NotificationQueryDto,
  UpdateNotificationPreferencesDto,
} from './dto/notifications.dto';

@Controller('notifications')
@RequirePermissions(Permissions.NOTIFICATIONS_MANAGE)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.findAll(user.sub, query);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Get('statistics')
  async getStatistics(@CurrentUser() user: JwtPayload) {
    const userId = user.sub;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - today.getDay()); // Start of week

    const baseWhere = { userId, deletedAt: null };

    const [
      total,
      unread,
      todayCount,
      thisWeekCount,
      groupByCategory,
      groupByPriority,
    ] = await Promise.all([
      this.prisma.notification.count({ where: baseWhere }),
      this.prisma.notification.count({
        where: { ...baseWhere, isRead: false },
      }),
      this.prisma.notification.count({
        where: { ...baseWhere, createdAt: { gte: today } },
      }),
      this.prisma.notification.count({
        where: { ...baseWhere, createdAt: { gte: thisWeek } },
      }),
      this.prisma.notification.groupBy({
        by: ['category'],
        where: baseWhere,
        _count: true,
      }),
      this.prisma.notification.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    return {
      total,
      unread,
      today: todayCount,
      thisWeek: thisWeekCount,
      byCategory: groupByCategory.reduce(
        (acc, curr) => ({ ...acc, [curr.category]: curr._count }),
        {},
      ),
      byPriority: groupByPriority.reduce(
        (acc, curr) => ({ ...acc, [curr.priority]: curr._count }),
        {},
      ),
    };
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.sub, body);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub, user.role);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.sub, id, user.role);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.delete(user.sub, id, user.role);
  }
}
