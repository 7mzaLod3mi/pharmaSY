"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryRepository } from "../api/inventory.repository.instance";
import { inventoryQueryKeys } from "../api/inventory.query-keys";
import type {
  AdjustInventoryBatchInput,
  CreateInventoryBatchInput,
  ExpiryAlert,
  LowStockAlert,
} from "../api/inventory.types";

export function useInventoryOverview() {
  return useQuery({
    queryKey: inventoryQueryKeys.overview(),
    queryFn: () => inventoryRepository.getOverview(),
  });
}

export function useInventoryProducts() {
  return useQuery({
    queryKey: inventoryQueryKeys.products(),
    queryFn: () => inventoryRepository.listProducts(),
  });
}

export function useInventoryProduct(id: string) {
  return useQuery({
    queryKey: inventoryQueryKeys.product(id),
    queryFn: () => inventoryRepository.getProduct(id),
    enabled: !!id,
  });
}

export function useInventoryMovements(productId?: string) {
  return useQuery({
    queryKey: inventoryQueryKeys.movements(productId),
    queryFn: () => inventoryRepository.listMovements(productId),
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryBatchInput) =>
      inventoryRepository.createBatch(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
  });
}

export function useAdjustBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AdjustInventoryBatchInput;
    }) => inventoryRepository.adjustBatch(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryRepository.deleteBatch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: [...inventoryQueryKeys.all, "alerts", "low-stock"],
    queryFn: async () => {
      const { apiRequest } = await import("@/lib/http-client");
      const res = await apiRequest<LowStockAlert[]>({ method: "GET", url: "/inventory/alerts/low-stock" });
      return res;
    },
  });
}

export function useExpiryAlerts(days: number = 90) {
  return useQuery({
    queryKey: [...inventoryQueryKeys.all, "alerts", "expiry", days],
    queryFn: async () => {
      const { apiRequest } = await import("@/lib/http-client");
      const res = await apiRequest<ExpiryAlert[]>({ method: "GET", url: `/inventory/alerts/expiry?days=${days}` });
      return res;
    },
  });
}
