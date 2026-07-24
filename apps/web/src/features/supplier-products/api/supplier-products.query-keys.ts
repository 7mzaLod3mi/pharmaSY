import type { SupplierProductFilters } from "./supplier-products.types";

export const supplierProductsQueryKeys = {
  all: ["supplier-products"] as const,
  list: (filters?: SupplierProductFilters) => [...supplierProductsQueryKeys.all, "list", filters ?? {}] as const,
};
