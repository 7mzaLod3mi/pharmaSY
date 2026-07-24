"use client";

import { useQuery } from "@tanstack/react-query";
import { inventoryRepository } from "../api/inventory.repository.instance";
import { inventoryQueryKeys } from "../api/inventory.query-keys";

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
