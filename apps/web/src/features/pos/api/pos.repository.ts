import type { CreateSaleDto, CreateSaleReturnDto, CancelSaleDto, SaleQueryDto } from "./pos.types";

export interface PosRepository {
  createSale(dto: CreateSaleDto): Promise<any>;
  findSales(query: SaleQueryDto): Promise<any>;
  getSale(saleId: string): Promise<any>;
  createReturn(saleId: string, dto: CreateSaleReturnDto): Promise<any>;
  cancelSale(saleId: string, dto: CancelSaleDto): Promise<any>;
}
