"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersRepository } from "../api/orders.repository.instance";
import { ordersQueryKeys } from "../api/orders.query-keys";
import type { OrderDetails, OrderFilters } from "../api/orders.types";

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ordersQueryKeys.list(filters),
    queryFn: () => ordersRepository.listOrders(filters),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ordersQueryKeys.detail(id),
    queryFn: () => ordersRepository.getOrder(id),
    enabled: !!id,
  });
}

export function useOrderDetails(id: string) {
  return useQuery({
    queryKey: [...ordersQueryKeys.all, "details", id],
    queryFn: async () => {
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

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersRepository.cancelOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersQueryKeys.all }),
  });
}

export function useConfirmOrderDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersRepository.confirmDelivery(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersQueryKeys.all }),
  });
}
