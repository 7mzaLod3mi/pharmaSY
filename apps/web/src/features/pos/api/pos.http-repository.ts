import { apiRequest } from "@/lib/http-client";
import type { PosRepository } from "./pos.repository";
import type { CreateSaleDto, CreateSaleReturnDto, CancelSaleDto, SaleQueryDto } from "./pos.types";

export const posHttpRepository: PosRepository = {
  createSale(dto: CreateSaleDto) {
    return apiRequest({ method: "POST", url: "/pos/sales", data: dto });
  },
  findSales(query: SaleQueryDto) {
    return apiRequest({ method: "GET", url: "/pos/sales", params: query });
  },
  getSale(saleId: string) {
    return apiRequest({ method: "GET", url: `/pos/sales/${saleId}` });
  },
  createReturn(saleId: string, dto: CreateSaleReturnDto) {
    return apiRequest({ method: "POST", url: `/pos/sales/${saleId}/returns`, data: dto });
  },
  cancelSale(saleId: string, dto: CancelSaleDto) {
    return apiRequest({ method: "POST", url: `/pos/sales/${saleId}/cancel`, data: dto });
  }
};
