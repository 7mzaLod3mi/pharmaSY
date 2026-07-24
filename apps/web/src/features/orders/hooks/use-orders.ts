"use client";

import { useQuery } from "@tanstack/react-query";
import { ordersRepository } from "../api/orders.repository.instance";
import { ordersQueryKeys } from "../api/orders.query-keys";
import type { OrderFilters } from "../api/orders.types";

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
