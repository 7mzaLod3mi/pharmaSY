import type { OrderFilters } from "./orders.types";

export const ordersQueryKeys = {
  all: ["orders"] as const,
  list: (filters?: OrderFilters) => [...ordersQueryKeys.all, "list", filters ?? {}] as const,
  detail: (id: string) => [...ordersQueryKeys.all, "detail", id] as const,
};
