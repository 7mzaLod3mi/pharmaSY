import type { Order, OrderFilters } from "./orders.types";

export interface OrdersRepository {
  listOrders(filters?: OrderFilters): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
}
