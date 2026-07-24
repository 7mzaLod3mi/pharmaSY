import type {
  SupplierProduct,
  SupplierProductFilters,
  UpsertSupplierProductInput,
} from "./supplier-products.types";

export interface SupplierProductsRepository {
  listProducts(filters?: SupplierProductFilters): Promise<SupplierProduct[]>;
  toggleAvailability(id: string): Promise<SupplierProduct>;
  upsert(payload: UpsertSupplierProductInput): Promise<SupplierProduct>;
  remove(id: string): Promise<void>;
}
