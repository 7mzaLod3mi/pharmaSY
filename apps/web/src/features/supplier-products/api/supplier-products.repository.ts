import type { SupplierProduct, SupplierProductFilters } from "./supplier-products.types";

export interface SupplierProductsRepository {
  listProducts(filters?: SupplierProductFilters): Promise<SupplierProduct[]>;
  toggleAvailability(id: string): Promise<SupplierProduct>;
}
