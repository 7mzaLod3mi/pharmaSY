export interface PosPaymentDto {
  method:
    | "CASH"
    | "CARD"
    | "BANK_TRANSFER"
    | "MOBILE_WALLET"
    | "CREDIT"
    | "OTHER";
  amount: number;
  reference?: string;
}

export interface PosDiscountDto {
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
}

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineDiscountAmount?: number;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  discount?: PosDiscountDto;
  payments?: PosPaymentDto[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  clientMutationId: string;
  deviceId: string;
  clientCreatedAt?: string;
}

export interface CreateSaleReturnItemDto {
  saleItemId: string;
  quantity: number;
}

export interface CreateSaleReturnDto {
  items: CreateSaleReturnItemDto[];
  reason: string;
  refunds?: PosPaymentDto[];
  clientMutationId: string;
  deviceId: string;
  clientCreatedAt?: string;
}

export interface CancelSaleDto {
  reason: string;
  refunds?: PosPaymentDto[];
  clientMutationId: string;
  deviceId: string;
  clientCreatedAt?: string;
}

export interface SaleQueryDto {
  status?: string;
  from?: string;
  to?: string;
  staffUserId?: string;
  page?: number;
  limit?: number;
}

export interface PosSaleItem {
  id: string;
  productId: string;
  productNameAr: string;
  productNameEn: string;
  quantity: number;
  returnedQuantity?: number;
  returnedAmount?: number | string;
  unitPrice: number | string;
  lineDiscountAmount: number | string;
  saleDiscountAmount: number | string;
  netAmount: number | string;
}

export interface PosSalePayment {
  id: string;
  type?: "PAYMENT" | "REFUND";
  method: PosPaymentDto["method"];
  amount: number | string;
  reference?: string | null;
}

export interface PosSaleReturn {
  id: string;
  returnNumber: string;
  type: "RETURN" | "CANCELLATION";
  reason: string;
  returnAmount: number | string;
  refundAmount: number | string;
  createdAt: string;
}

export interface PosSale {
  id: string;
  saleNumber: string;
  status: string;
  paymentStatus?: string;
  subtotal: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  refundedAmount?: number | string;
  tenderedAmount?: number | string;
  changeAmount?: number | string;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  createdAt: string;
  staffUser?: { id: string; firstName: string; lastName: string };
  items: PosSaleItem[];
  payments: PosSalePayment[];
  returns?: Array<{ id: string; type: string; reason: string; createdAt: string }>;
}

export interface PosSalesPage {
  data: PosSale[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
