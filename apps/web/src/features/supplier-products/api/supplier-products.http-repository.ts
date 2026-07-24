import { apiRequest } from "@/lib/http-client";
import type { SupplierProductsRepository } from "./supplier-products.repository";
import type {
  QuantityDiscountTier,
  SupplierProduct,
  SupplierProductFilters,
  UpsertSupplierProductInput,
} from "./supplier-products.types";

interface RawSupplierProduct {
  id: string;
  price: number | string;
  stock: number;
  minOrder: number;
  isAvailable: boolean;
  expiryDate?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  quantityDiscounts?: unknown;
  product: {
    id: string;
    sku?: string | null;
    barcode?: string | null;
    tradeNameAr: string;
    tradeNameEn: string;
    category?: { nameAr: string; nameEn: string } | null;
  };
}

interface Paged<T> {
  data: T[];
}

function isArabic() {
  return typeof document !== "undefined" && document.documentElement.lang === "ar";
}

function mapProduct(item: RawSupplierProduct): SupplierProduct {
  const name = isArabic() ? item.product.tradeNameAr : item.product.tradeNameEn;
  const category = item.product.category
    ? isArabic()
      ? item.product.category.nameAr
      : item.product.category.nameEn
    : "—";
  return {
    id: item.id,
    productId: item.product.id,
    sku: item.product.sku ?? item.product.barcode ?? item.product.id,
    name,
    category,
    price: Number(item.price),
    moq: item.minOrder,
    stock: item.stock,
    expiryDate: item.expiryDate ?? undefined,
    batchNumber: item.batchNumber ?? undefined,
    notes: item.notes ?? undefined,
    isAvailable: item.isAvailable,
    quantityDiscounts: Array.isArray(item.quantityDiscounts)
      ? (item.quantityDiscounts as QuantityDiscountTier[])
      : [],
    status: !item.isAvailable ? "inactive" : item.stock <= item.minOrder ? "low_stock" : "active",
  };
}

export const supplierProductsHttpRepository: SupplierProductsRepository = {
  async listProducts(filters?: SupplierProductFilters) {
    const response = await apiRequest<Paged<RawSupplierProduct>>({
      method: "GET",
      url: "/supplier-products",
      params: { limit: 100 },
    });
    const search = filters?.search?.trim().toLowerCase();
    return response.data
      .map(mapProduct)
      .filter((item) => !search || item.name.toLowerCase().includes(search) || item.sku.toLowerCase().includes(search));
  },
  async toggleAvailability(id: string) {
    const current = (await this.listProducts()).find((item) => item.id === id);
    const updated = await apiRequest<RawSupplierProduct>({
      method: "PATCH",
      url: `/supplier-products/${id}`,
      data: { isAvailable: current?.status === "inactive" },
    });
    return mapProduct(updated);
  },
  async upsert(payload: UpsertSupplierProductInput) {
    const response = await apiRequest<RawSupplierProduct>({
      method: "POST",
      url: "/supplier-products",
      data: payload,
    });
    return mapProduct(response);
  },
  async remove(id: string) {
    await apiRequest({
      method: "DELETE",
      url: `/supplier-products/${id}`,
    });
  },
};
