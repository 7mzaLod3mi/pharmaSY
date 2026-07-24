"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posRepository } from "../api/pos.repository.instance";
import type { SaleQueryDto, CreateSaleDto, CreateSaleReturnDto, CancelSaleDto } from "../api/pos.types";

export const posQueryKeys = {
  all: ["pos"] as const,
  sales: (query?: SaleQueryDto) => [...posQueryKeys.all, "sales", query] as const,
  sale: (id: string) => [...posQueryKeys.all, "sale", id] as const,
};

export function usePosSales(query?: SaleQueryDto) {
  return useQuery({
    queryKey: posQueryKeys.sales(query),
    queryFn: () => posRepository.findSales(query || {}).then(res => res.data),
  });
}

export function usePosSale(id: string) {
  return useQuery({
    queryKey: posQueryKeys.sale(id),
    queryFn: () => posRepository.getSale(id).then(res => res as any),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSaleDto) => posRepository.createSale(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: posQueryKeys.all }),
  });
}

export function useCreateSaleReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateSaleReturnDto }) => posRepository.createReturn(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: posQueryKeys.all }),
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CancelSaleDto }) => posRepository.cancelSale(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: posQueryKeys.all }),
  });
}
