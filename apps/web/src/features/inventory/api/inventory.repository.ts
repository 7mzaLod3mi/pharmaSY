import type {
  AdjustInventoryBatchInput,
  CreateInventoryBatchInput,
  InventoryMovement,
  InventoryOverview,
  InventoryProduct,
  UpdateInventoryBatchInput,
} from "./inventory.types";

/** UI-facing inventory contract implemented by the live HTTP repository. */
export interface InventoryRepository {
  getOverview(): Promise<InventoryOverview>;
  listProducts(): Promise<InventoryProduct[]>;
  getProduct(id: string): Promise<InventoryProduct | undefined>;
  listMovements(productId?: string): Promise<InventoryMovement[]>;
  createBatch(data: CreateInventoryBatchInput): Promise<void>;
  adjustBatch(id: string, data: AdjustInventoryBatchInput): Promise<void>;
  updateBatch(id: string, data: UpdateInventoryBatchInput): Promise<void>;
  deleteBatch(id: string): Promise<void>;
}
