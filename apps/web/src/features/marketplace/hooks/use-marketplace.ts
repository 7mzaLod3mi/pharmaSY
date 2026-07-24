"use client";

import { useQuery } from "@tanstack/react-query";
import { marketplaceRepository } from "../api/marketplace.repository.instance";
import { marketplaceQueryKeys } from "../api/marketplace.query-keys";
import type { MarketplaceFilters } from "../api/marketplace.types";

export function useMarketplaceProducts(filters?: MarketplaceFilters) {
  return useQuery({
    queryKey: marketplaceQueryKeys.products(filters),
    queryFn: () => marketplaceRepository.listProducts(filters),
  });
}

export function useMarketplaceProduct(id: string) {
  return useQuery({
    queryKey: marketplaceQueryKeys.product(id),
    queryFn: () => marketplaceRepository.getProduct(id),
    enabled: !!id,
  });
}

export function useMarketplaceProductOffers(productId: string) {
  return useQuery({
    queryKey: [...marketplaceQueryKeys.product(productId), "offers"],
    queryFn: () => marketplaceRepository.listProductOffers(productId),
    enabled: !!productId,
  });
}

export function useMarketplaceCategories() {
  return useQuery({
    queryKey: marketplaceQueryKeys.categories(),
    queryFn: () => marketplaceRepository.listCategories(),
  });
}
