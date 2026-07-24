"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supplierOrdersRepository } from "../api/supplier-orders.repository.instance";
import { supplierOrdersQueryKeys } from "../api/supplier-orders.query-keys";
import type { SupplierOrderFilters, SupplierOrderStatus } from "../api/supplier-orders.types";
import type { OrderDetails } from "@/features/orders/api/orders.types";

export function useSupplierOrders(filters?: SupplierOrderFilters) {
  return useQuery({
    queryKey: supplierOrdersQueryKeys.list(filters),
    queryFn: () => supplierOrdersRepository.listOrders(filters),
  });
}

export function useUpdateSupplierOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupplierOrderStatus }) =>
      supplierOrdersRepository.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierOrdersQueryKeys.all }),
  });
}

export function useSupplierOrderDetails(id: string) {
  return useQuery({
    queryKey: [...supplierOrdersQueryKeys.all, "details", id],
    queryFn: async () => {
      // Direct call to API
      const { apiRequest } = await import("@/lib/http-client");
      const res = await apiRequest<OrderDetails>({
        method: "GET",
        url: `/orders/${id}`,
      });
      return res;
    },
    enabled: !!id,
  });
}
