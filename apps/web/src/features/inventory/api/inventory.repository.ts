import type { InventoryMovement, InventoryOverview, InventoryProduct } from "./inventory.types";

/** UI-facing inventory contract implemented by the live HTTP repository. */
export interface InventoryRepository {
  getOverview(): Promise<InventoryOverview>;
  listProducts(): Promise<InventoryProduct[]>;
  getProduct(id: string): Promise<InventoryProduct | undefined>;
  listMovements(productId?: string): Promise<InventoryMovement[]>;
}
