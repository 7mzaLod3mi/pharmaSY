export interface InventoryBatch {
  id: string;
  batchNumber: string;
  expiryDate: string; // ISO date
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  sellingPrice?: number;
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
  /** Selling price of the first sellable FEFO batch. */
  sellingPrice?: number;
  batches: InventoryBatch[];
}

export interface CreateInventoryBatchInput {
  productId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseCost: number;
  sellingPrice?: number;
  minStock?: number;
  location?: string;
}

export type InventoryAdjustmentType =
  | "MANUAL_ADJUSTMENT"
  | "DAMAGED"
  | "EXPIRED"
  | "ADMIN_CORRECTION";

export interface AdjustInventoryBatchInput {
  quantity: number;
  type: InventoryAdjustmentType;
  reason: string;
  notes?: string;
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

export interface LowStockAlert {
  productId: string;
  productName: string;
  totalAvailable: number;
  minStock: number;
}

export interface ExpiryAlert {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  reservedStock: number;
  product: {
    id: string;
    tradeNameAr: string;
    tradeNameEn: string;
    barcode?: string | null;
  };
}
