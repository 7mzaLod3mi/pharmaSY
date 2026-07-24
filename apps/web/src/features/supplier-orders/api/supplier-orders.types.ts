export type SupplierOrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface SupplierOrder {
  id: string;
  orderNumber?: string;
  pharmacyName: string;
  placedAt: string; // ISO date
  itemCount: number;
  total: number;
  status: SupplierOrderStatus;
}

export interface SupplierOrderFilters {
  status?: SupplierOrderStatus;
}

export const nextSupplierOrderStatus: Record<SupplierOrderStatus, SupplierOrderStatus | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};
