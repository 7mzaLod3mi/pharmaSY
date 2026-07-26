import { apiRequest } from "@/lib/http-client";
import type { OrdersRepository } from "./orders.repository";
import type { Order, OrderFilters, OrderStatus } from "./orders.types";

interface RawOrder {
  id: string;
  orderNumber?: string;
  supplierId?: string | null;
  supplier?: { id: string; name: string } | null;
  sellerPharmacy?: { id: string; name: string } | null;
  createdAt: string;
  totalAmount: number | string;
  status: string;
  _count?: { items: number };
}

interface PagedOrders {
  data: RawOrder[];
}

function mapOrder(order: RawOrder): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    supplierId: order.supplierId ?? order.sellerPharmacy?.id ?? "",
    supplierName: order.supplier?.name ?? order.sellerPharmacy?.name ?? "Pharmacy seller",
    placedAt: order.createdAt,
    itemCount: order._count?.items ?? 0,
    total: Number(order.totalAmount),
    status: order.status.toLowerCase() as OrderStatus,
  };
}

export const ordersHttpRepository: OrdersRepository = {
  async listOrders(filters?: OrderFilters) {
    const result = await apiRequest<PagedOrders>({
      method: "GET",
      url: "/orders/pharmacy",
      params: { limit: 100 },
    });
    const search = filters?.search?.toLowerCase();
    return result.data.map(mapOrder).filter((order) => {
      if (filters?.status && order.status !== filters.status) return false;
      if (search && !order.id.toLowerCase().includes(search) && !order.supplierName.toLowerCase().includes(search)) return false;
      return true;
    });
  },
  async getOrder(id: string) {
    const order = await apiRequest<RawOrder>({ method: "GET", url: `/orders/${id}` });
    return mapOrder(order);
  },
  async cancelOrder(id: string) {
    await apiRequest({
      method: "PATCH",
      url: `/orders/${id}/status`,
      data: { status: "CANCELLED" },
    });
  },
  async confirmDelivery(id: string) {
    await apiRequest({
      method: "PATCH",
      url: `/orders/${id}/status`,
      data: { status: "DELIVERED" },
    });
  },
};
