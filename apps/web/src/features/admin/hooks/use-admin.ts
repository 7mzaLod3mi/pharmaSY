"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiRequest } from "@/lib/http-client";
import type { ApiResponse, PaginationQuery, User, UserStatus } from "@pharmasyn/types";

export interface AdminDashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  pendingPharmacies: number;
  pendingSuppliers: number;
  totalPharmacies: number;
  totalSuppliers: number;
  totalOrders: number;
}

export interface AdminAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  prevValues?: unknown;
  newValues?: unknown;
  userRole: string;
  reason?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () =>
      apiRequest<AdminDashboardStats>({
        method: "GET",
        url: "/admin/stats",
      }),
  });
}

// -- Users

export function useAdminUsers(query?: PaginationQuery & { role?: string; status?: UserStatus }) {
  return useQuery({
    queryKey: ["admin", "users", query],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (query?.page) searchParams.set("page", query.page.toString());
      if (query?.limit) searchParams.set("limit", query.limit.toString());
      if (query?.role) searchParams.set("role", query.role);
      if (query?.status) searchParams.set("status", query.status);

      const res = await apiClient.get<ApiResponse<User[]>>(`/admin/users?${searchParams.toString()}`);
      return res.data;
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/admin/users/${id}/suspend`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/admin/users/${id}/activate`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// -- Audit Logs

export function useAuditLogs(query?: { page?: number; limit?: number; entityType?: string; userId?: string }) {
  return useQuery({
    queryKey: ["admin", "audit-logs", query],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (query?.page) searchParams.set("page", query.page.toString());
      if (query?.limit) searchParams.set("limit", query.limit.toString());
      if (query?.entityType) searchParams.set("entityType", query.entityType);
      if (query?.userId) searchParams.set("userId", query.userId);

      const res = await apiClient.get<ApiResponse<AdminAuditLog[]>>(`/audit-logs?${searchParams.toString()}`);
      return res.data;
    },
  });
}
