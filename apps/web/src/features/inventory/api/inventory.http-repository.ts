import { apiRequest } from "@/lib/http-client";
import type { InventoryRepository } from "./inventory.repository";
import type {
  InventoryBatch,
  InventoryMovement,
  InventoryOverview,
  InventoryProduct,
} from "./inventory.types";

interface RawBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  reservedStock: number;
  minStock: number;
  sellingPrice?: number | string | null;
  productId: string;
  product: {
    id: string;
    sku?: string | null;
    barcode?: string | null;
    tradeNameAr: string;
    tradeNameEn: string;
  };
}

interface RawMovement {
  id: string;
  batchNumber: string;
  type: string;
  difference: number;
  quantity: number;
  createdAt: string;
  user?: { firstName: string; lastName: string } | null;
}

interface Paged<T> {
  data: T[];
}

interface DashboardMetrics {
  totalValue: number;
  available: number;
  reserved: number;
  expiredCount: number;
  nearExpiryCount: number;
}

function localizedName(batch: RawBatch) {
  return typeof document !== "undefined" && document.documentElement.lang === "ar"
    ? batch.product.tradeNameAr
    : batch.product.tradeNameEn;
}

function batchStatus(batch: RawBatch): InventoryBatch["status"] {
  const expiry = new Date(batch.expiryDate).getTime();
  if (expiry < Date.now()) return "expired";
  if (expiry <= Date.now() + 90 * 24 * 60 * 60 * 1000) return "near_expiry";
  return "active";
}

async function listRawBatches() {
  const response = await apiRequest<Paged<RawBatch>>({
    method: "GET",
    url: "/inventory",
    params: { limit: 100 },
  });
  return response.data;
}

function groupProducts(batches: RawBatch[]): InventoryProduct[] {
  const grouped = new Map<string, InventoryProduct>();
  for (const batch of batches) {
    const available = Math.max(0, batch.quantity - batch.reservedStock);
    const uiBatch: InventoryBatch = {
      id: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      reservedQuantity: batch.reservedStock,
      availableQuantity: available,
      sellingPrice:
        batch.sellingPrice === null || batch.sellingPrice === undefined
          ? undefined
          : Number(batch.sellingPrice),
      status: batchStatus(batch),
    };
    const existing = grouped.get(batch.productId);
    if (existing) {
      existing.totalQuantity += batch.quantity;
      existing.availableQuantity += available;
      existing.reservedQuantity += batch.reservedStock;
      existing.lowStockThreshold = Math.max(existing.lowStockThreshold, batch.minStock);
      existing.batches.push(uiBatch);
      if (existing.sellingPrice === undefined && uiBatch.sellingPrice !== undefined) {
        existing.sellingPrice = uiBatch.sellingPrice;
      }
    } else {
      grouped.set(batch.productId, {
        id: batch.productId,
        sku: batch.product.sku ?? batch.product.barcode ?? batch.productId,
        name: localizedName(batch),
        totalQuantity: batch.quantity,
        availableQuantity: available,
        reservedQuantity: batch.reservedStock,
        lowStockThreshold: batch.minStock,
        sellingPrice: uiBatch.sellingPrice,
        batches: [uiBatch],
      });
    }
  }
  return [...grouped.values()];
}

function movementType(type: string): InventoryMovement["type"] {
  if (type.includes("SALE")) return "sale_out";
  if (type.includes("ORDER") || type.includes("PURCHASE")) return "purchase_in";
  if (type.includes("EXCHANGE")) return type.includes("IN") ? "exchange_in" : "exchange_out";
  if (type.includes("EXPIRED")) return "expired_write_off";
  return "adjustment";
}

export const inventoryHttpRepository: InventoryRepository = {
  async getOverview(): Promise<InventoryOverview> {
    const [metrics, lowStock] = await Promise.all([
      apiRequest<DashboardMetrics>({ method: "GET", url: "/inventory/dashboard" }),
      apiRequest<unknown[]>({ method: "GET", url: "/inventory/alerts/low-stock" }),
    ]);
    return {
      totalInventoryValue: Number(metrics.totalValue),
      availableStockCount: metrics.available,
      reservedStockCount: metrics.reserved,
      lowStockCount: lowStock.length,
      nearExpiryCount: metrics.nearExpiryCount,
      expiredCount: metrics.expiredCount,
    };
  },
  async listProducts() {
    return groupProducts(await listRawBatches());
  },
  async getProduct(id: string) {
    return (await this.listProducts()).find((product) => product.id === id);
  },
  async listMovements(productId?: string) {
    if (!productId) return [];
    const product = await this.getProduct(productId);
    if (!product) return [];
    const pages = await Promise.all(
      product.batches.map((batch) =>
        apiRequest<Paged<RawMovement>>({
          method: "GET",
          url: `/inventory/${batch.id}/movements`,
          params: { limit: 100 },
        })
      )
    );
    return pages
      .flatMap((page) => page.data)
      .map((movement) => ({
        id: movement.id,
        productName: product.name,
        batchNumber: movement.batchNumber,
        type: movementType(movement.type),
        quantity: movement.difference ?? movement.quantity,
        occurredAt: movement.createdAt,
        actor: movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : "System",
      }))
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  },
  async createBatch(data) {
    await apiRequest({
      method: "POST",
      url: "/inventory",
      data,
    });
  },
  async adjustBatch(id, data) {
    await apiRequest({
      method: "PATCH",
      url: `/inventory/${id}/adjust`,
      data,
    });
  },
  async deleteBatch(id: string) {
    await apiRequest({
      method: "DELETE",
      url: `/inventory/${id}`,
    });
  },
};
