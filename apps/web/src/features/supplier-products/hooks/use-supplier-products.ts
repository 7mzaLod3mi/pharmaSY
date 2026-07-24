"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supplierProductsRepository } from "../api/supplier-products.repository.instance";
import { supplierProductsQueryKeys } from "../api/supplier-products.query-keys";
import type {
  SupplierProductFilters,
  UpsertSupplierProductInput,
} from "../api/supplier-products.types";

export function useSupplierProducts(filters?: SupplierProductFilters) {
  return useQuery({
    queryKey: supplierProductsQueryKeys.list(filters),
    queryFn: () => supplierProductsRepository.listProducts(filters),
  });
}

export function useToggleSupplierProductAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supplierProductsRepository.toggleAvailability(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierProductsQueryKeys.all }),
  });
}

export function useUpsertSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertSupplierProductInput) =>
      supplierProductsRepository.upsert(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierProductsQueryKeys.all }),
  });
}

export function useRemoveSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supplierProductsRepository.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierProductsQueryKeys.all }),
  });
}
