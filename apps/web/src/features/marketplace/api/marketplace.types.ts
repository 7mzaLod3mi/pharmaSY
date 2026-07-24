export interface MarketplaceCategory {
  id: string;
  name: string;
}

export interface MarketplaceProduct {
  id: string;
  productId: string;
  offerType: "SUPPLIER" | "PHARMACY";
  sku: string;
  name: string;
  manufacturer: string;
  categoryId: string;
  supplierId: string;
  supplierName: string;
  price: number;
  moq: number;
  stock: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
}

export interface MarketplaceFilters {
  search?: string;
  categoryId?: string;
}
