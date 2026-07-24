export interface InventoryBatch {
  id: string;
  batchNumber: string;
  expiryDate: string; // ISO date
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  status: "active" | "near_expiry" | "expired" | "damaged" | "blocked";
}

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  batches: InventoryBatch[];
}

export interface InventoryOverview {
  totalInventoryValue: number;
  availableStockCount: number;
  reservedStockCount: number;
  lowStockCount: number;
  nearExpiryCount: number;
  expiredCount: number;
}

export interface InventoryMovement {
  id: string;
  productName: string;
  batchNumber: string;
  type: "purchase_in" | "sale_out" | "adjustment" | "exchange_out" | "exchange_in" | "expired_write_off";
  quantity: number;
  occurredAt: string; // ISO datetime
  actor: string;
}
