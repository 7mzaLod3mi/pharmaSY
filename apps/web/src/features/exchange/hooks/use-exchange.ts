"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exchangeRepository } from "../api/exchange.repository.instance";
import { exchangeQueryKeys } from "../api/exchange.query-keys";
import type { ExchangeFilters } from "../api/exchange.types";
import type { CreateExchangeListingFormValues } from "../schemas/create-listing.schema";

export function useExchangeListings(filters?: ExchangeFilters) {
  return useQuery({
    queryKey: exchangeQueryKeys.list(filters),
    queryFn: () => exchangeRepository.listListings(filters),
  });
}

export function useExchangeListing(id: string) {
  return useQuery({
    queryKey: exchangeQueryKeys.detail(id),
    queryFn: () => exchangeRepository.getListing(id),
    enabled: !!id,
  });
}

export function useCreateExchangeListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExchangeListingFormValues) => exchangeRepository.createListing(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeQueryKeys.all });
    },
  });
}
