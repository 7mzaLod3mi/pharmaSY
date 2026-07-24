import type { ExchangeFilters } from "./exchange.types";

export const exchangeQueryKeys = {
  all: ["exchange"] as const,
  list: (filters?: ExchangeFilters) => [...exchangeQueryKeys.all, "list", filters ?? {}] as const,
  detail: (id: string) => [...exchangeQueryKeys.all, "detail", id] as const,
};
