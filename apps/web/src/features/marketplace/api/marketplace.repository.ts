import type { MarketplaceCategory, MarketplaceFilters, MarketplaceProduct } from "./marketplace.types";

export interface MarketplaceRepository {
  listProducts(filters?: MarketplaceFilters): Promise<MarketplaceProduct[]>;
  getProduct(id: string): Promise<MarketplaceProduct | undefined>;
  listProductOffers(productId: string): Promise<MarketplaceProduct[]>;
  listCategories(): Promise<MarketplaceCategory[]>;
}
