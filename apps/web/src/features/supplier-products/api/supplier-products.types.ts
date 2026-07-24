export type SupplierProductStatus = "active" | "low_stock" | "inactive";

export interface SupplierProduct {
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  moq: number;
  stock: number;
  expiryDate?: string;
  batchNumber?: string;
  notes?: string;
  isAvailable: boolean;
  quantityDiscounts: QuantityDiscountTier[];
  status: SupplierProductStatus;
}

export interface QuantityDiscountTier {
  minQuantity: number;
  unitPrice: number;
}

export interface UpsertSupplierProductInput {
  productId: string;
  price: number;
  stock: number;
  minOrder: number;
  expiryDate?: string;
  notes?: string;
  isAvailable?: boolean;
  batchNumber?: string;
  quantityDiscounts?: QuantityDiscountTier[];
}

export interface SupplierProductFilters {
  search?: string;
}
