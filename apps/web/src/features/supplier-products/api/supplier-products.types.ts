export type SupplierProductStatus = "active" | "low_stock" | "inactive";

export interface SupplierProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  moq: number;
  status: SupplierProductStatus;
}

export interface SupplierProductFilters {
  search?: string;
}
