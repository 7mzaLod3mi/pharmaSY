import type { SupplierOrderFilters } from "./supplier-orders.types";

export const supplierOrdersQueryKeys = {
  all: ["supplier-orders"] as const,
  list: (filters?: SupplierOrderFilters) => [...supplierOrdersQueryKeys.all, "list", filters ?? {}] as const,
};
