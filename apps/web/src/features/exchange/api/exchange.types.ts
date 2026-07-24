export type ExchangeListingStatus =
  | "pending_review"
  | "active"
  | "paused"
  | "sold"
  | "expired"
  | "rejected";

export interface ExchangeListing {
  id: string;
  productName: string;
  batchNumber: string;
  expiryDate: string; // ISO date
  city: string;
  sellerPharmacyName: string;
  availableQuantity: number;
  reservedQuantity: number;
  price: number;
  status: ExchangeListingStatus;
  createdAt: string; // ISO datetime
  mine?: boolean;
}

export interface ExchangeFilters {
  search?: string;
  city?: string;
  mineOnly?: boolean;
}

export interface CreateExchangeListingInput {
  productName: string;
  batchNumber: string;
  expiryDate: string;
  city: string;
  quantity: number;
  price: number;
}
