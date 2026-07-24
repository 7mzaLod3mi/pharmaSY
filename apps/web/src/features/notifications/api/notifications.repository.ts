import type { AppNotification, NotificationFilters } from "./notifications.types";

export interface NotificationsRepository {
  listNotifications(filters?: NotificationFilters): Promise<AppNotification[]>;
  getUnreadCount(): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
}
