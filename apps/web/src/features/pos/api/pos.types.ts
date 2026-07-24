export interface PosPaymentDto {
  method: "CASH" | "CARD" | "TRANSFER" | "CREDIT";
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
}

export interface CancelSaleDto {
  reason: string;
  refunds?: PosPaymentDto[];
  clientMutationId: string;
  deviceId: string;
}

export interface SaleQueryDto {
  status?: string;
  from?: string;
  to?: string;
  staffUserId?: string;
  page?: number;
  limit?: number;
}
