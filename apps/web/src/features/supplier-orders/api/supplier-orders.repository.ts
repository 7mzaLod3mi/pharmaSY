import type { SupplierOrder, SupplierOrderFilters, SupplierOrderStatus } from "./supplier-orders.types";

export interface SupplierOrdersRepository {
  listOrders(filters?: SupplierOrderFilters): Promise<SupplierOrder[]>;
  updateStatus(id: string, status: SupplierOrderStatus): Promise<SupplierOrder>;
}
