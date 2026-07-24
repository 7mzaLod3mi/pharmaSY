import type { MarketplaceFilters } from "./marketplace.types";

export const marketplaceQueryKeys = {
  all: ["marketplace"] as const,
  products: (filters?: MarketplaceFilters) => [...marketplaceQueryKeys.all, "products", filters ?? {}] as const,
  product: (id: string) => [...marketplaceQueryKeys.all, "product", id] as const,
  categories: () => [...marketplaceQueryKeys.all, "categories"] as const,
};
