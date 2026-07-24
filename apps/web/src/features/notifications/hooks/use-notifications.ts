"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsRepository } from "../api/notifications.repository.instance";
import { notificationsQueryKeys } from "../api/notifications.query-keys";
import type { NotificationFilters } from "../api/notifications.types";

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationsQueryKeys.list(filters),
    queryFn: () => notificationsRepository.listNotifications(filters),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationsQueryKeys.unreadCount(),
    queryFn: () => notificationsRepository.getUnreadCount(),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsRepository.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsRepository.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all }),
  });
}
