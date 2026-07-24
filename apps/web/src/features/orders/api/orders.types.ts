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

export interface OrderProductSnapshot {
  id: string;
  tradeNameAr: string;
  tradeNameEn: string;
  unit: string;
  barcode?: string | null;
}

export interface OrderDetails {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  notes?: string | null;
  pharmacy?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    city?: string;
  } | null;
  supplier?: {
    id: string;
    name: string;
    phone?: string;
    city?: string;
  } | null;
  sellerPharmacy?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    city?: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    subtotal: number | string;
    supplierProduct?: { product: OrderProductSnapshot } | null;
    marketplaceOffer?: { product: OrderProductSnapshot } | null;
  }>;
}
