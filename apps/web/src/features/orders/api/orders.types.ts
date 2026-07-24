export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  orderNumber?: string;
  supplierId: string;
  supplierName: string;
  placedAt: string; // ISO date
  itemCount: number;
  total: number;
  status: OrderStatus;
}

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
}
