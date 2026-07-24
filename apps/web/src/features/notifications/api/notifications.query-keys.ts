import type { NotificationFilters } from "./notifications.types";

export const notificationsQueryKeys = {
  all: ["notifications"] as const,
  list: (filters?: NotificationFilters) => [...notificationsQueryKeys.all, "list", filters ?? {}] as const,
  unreadCount: () => [...notificationsQueryKeys.all, "unread-count"] as const,
};
