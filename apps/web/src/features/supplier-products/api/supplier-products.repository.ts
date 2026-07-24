import type { SupplierProduct, SupplierProductFilters } from "./supplier-products.types";

export interface SupplierProductsRepository {
  listProducts(filters?: SupplierProductFilters): Promise<SupplierProduct[]>;
  toggleAvailability(id: string): Promise<SupplierProduct>;
  upsert(payload: any): Promise<SupplierProduct>;
  remove(id: string): Promise<void>;
}
