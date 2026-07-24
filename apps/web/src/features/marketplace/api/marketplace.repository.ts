import type { MarketplaceCategory, MarketplaceFilters, MarketplaceProduct } from "./marketplace.types";

export interface MarketplaceRepository {
  listProducts(filters?: MarketplaceFilters): Promise<MarketplaceProduct[]>;
  getProduct(id: string): Promise<MarketplaceProduct | undefined>;
  listCategories(): Promise<MarketplaceCategory[]>;
}
