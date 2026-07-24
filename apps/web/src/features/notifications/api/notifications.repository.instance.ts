import type { NotificationsRepository } from "./notifications.repository";
import { notificationsHttpRepository } from "./notifications.http-repository";

/** REST adapter; Socket.io cache invalidation is handled by RealtimeNotifications. */
export const notificationsRepository: NotificationsRepository = notificationsHttpRepository;
