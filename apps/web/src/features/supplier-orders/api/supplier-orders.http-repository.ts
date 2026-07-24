import { apiRequest } from "@/lib/http-client";
import type { SupplierOrdersRepository } from "./supplier-orders.repository";
import type { SupplierOrder, SupplierOrderFilters, SupplierOrderStatus } from "./supplier-orders.types";

interface RawSupplierOrder {
  id: string;
  orderNumber?: string;
  pharmacy: { name: string };
  createdAt: string;
  totalAmount: number | string;
  status: string;
  _count?: { items: number };
}

interface PagedOrders {
  data: RawSupplierOrder[];
}

function mapStatus(status: string): SupplierOrderStatus {
  return status.toLowerCase() as SupplierOrderStatus;
}

function mapOrder(order: RawSupplierOrder): SupplierOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    pharmacyName: order.pharmacy.name,
    placedAt: order.createdAt,
    itemCount: order._count?.items ?? 0,
    total: Number(order.totalAmount),
    status: mapStatus(order.status),
  };
}

export const supplierOrdersHttpRepository: SupplierOrdersRepository = {
  async listOrders(filters?: SupplierOrderFilters) {
    const result = await apiRequest<PagedOrders>({
      method: "GET",
      url: "/orders/supplier",
      params: {
        limit: 100,
        status: filters?.status ? filters.status.toUpperCase() : undefined,
      },
    });
    return result.data.map(mapOrder);
  },
  async updateStatus(id: string, status: SupplierOrderStatus) {
    await apiRequest({
      method: "PATCH",
      url: `/orders/${id}/status`,
      data: { status: status.toUpperCase() },
    });
    const updated = (await this.listOrders()).find((order) => order.id === id);
    if (!updated) throw new Error("Updated order could not be reloaded.");
    return updated;
  },
};
