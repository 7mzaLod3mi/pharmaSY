export type NotificationType = "order" | "inventory" | "exchange" | "system" | "admin";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO datetime
  link?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  unreadOnly?: boolean;
}
