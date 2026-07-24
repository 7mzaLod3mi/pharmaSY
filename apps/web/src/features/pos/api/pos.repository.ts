import type {
  CancelSaleDto,
  CreateSaleDto,
  CreateSaleReturnDto,
  PosSale,
  PosSaleReturn,
  PosSalesPage,
  SaleQueryDto,
} from "./pos.types";

export interface PosRepository {
  createSale(dto: CreateSaleDto): Promise<PosSale>;
  findSales(query: SaleQueryDto): Promise<PosSalesPage>;
  getSale(saleId: string): Promise<PosSale>;
  createReturn(saleId: string, dto: CreateSaleReturnDto): Promise<PosSaleReturn>;
  cancelSale(saleId: string, dto: CancelSaleDto): Promise<PosSaleReturn>;
}
