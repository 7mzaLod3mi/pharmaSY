import { apiRequest } from "@/lib/http-client";
import type { NotificationsRepository } from "./notifications.repository";
import type { AppNotification, NotificationFilters, NotificationType } from "./notifications.types";

interface RawNotification {
  id: string;
  type: string;
  category: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string | null;
}

interface Paged<T> {
  data: T[];
}

function mapType(category: string): NotificationType {
  if (category === "ORDERS") return "order";
  if (category === "INVENTORY") return "inventory";
  if (category === "PHARMACY_EXCHANGE" || category === "MARKETPLACE") return "exchange";
  if (category === "ADMIN_APPROVAL") return "admin";
  return "system";
}

function mapNotification(item: RawNotification): AppNotification {
  const arabic = typeof document !== "undefined" && document.documentElement.lang === "ar";
  return {
    id: item.id,
    type: mapType(item.category),
    title: arabic ? item.titleAr : item.titleEn,
    message: arabic ? item.bodyAr : item.bodyEn,
    isRead: item.isRead,
    createdAt: item.createdAt,
    link: item.actionUrl ?? undefined,
  };
}

export const notificationsHttpRepository: NotificationsRepository = {
  async listNotifications(filters?: NotificationFilters) {
    const response = await apiRequest<Paged<RawNotification>>({
      method: "GET",
      url: "/notifications",
      params: { limit: 100, isRead: filters?.unreadOnly ? false : undefined },
    });
    return response.data
      .map(mapNotification)
      .filter((item) => !filters?.type || item.type === filters.type);
  },
  async getUnreadCount() {
    const response = await apiRequest<{ count: number }>({
      method: "GET",
      url: "/notifications/unread-count",
    });
    return response.count;
  },
  async markAsRead(id: string) {
    await apiRequest({ method: "PATCH", url: `/notifications/${id}/read` });
  },
  async markAllAsRead() {
    await apiRequest({ method: "PATCH", url: "/notifications/read-all" });
  },
};
