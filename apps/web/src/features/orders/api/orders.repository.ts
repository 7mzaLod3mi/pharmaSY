import type { Order, OrderFilters } from "./orders.types";

export interface OrdersRepository {
  listOrders(filters?: OrderFilters): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  cancelOrder(id: string): Promise<void>;
  confirmDelivery(id: string): Promise<void>;
}
