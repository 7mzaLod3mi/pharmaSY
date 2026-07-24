import { apiRequest } from "@/lib/http-client";
import type { MarketplaceRepository } from "./marketplace.repository";
import type { MarketplaceCategory, MarketplaceFilters, MarketplaceProduct } from "./marketplace.types";

interface CategoryNode {
  id: string;
  nameAr: string;
  nameEn: string;
  children?: CategoryNode[];
}

interface MarketplaceOffer {
  id: string;
  offerType: "SUPPLIER" | "PHARMACY";
  productId: string;
  price: number | string;
  stock: number;
  minOrder: number;
  isAvailable: boolean;
  supplierId: string;
  supplier: { id: string; name: string };
  product: {
    id: string;
    sku?: string | null;
    barcode?: string | null;
    tradeNameAr: string;
    tradeNameEn: string;
    categoryId: string;
    manufacturer?: { name: string } | null;
  };
}

interface Paged<T> {
  data: T[];
}

function localizedName(ar: string, en: string) {
  return typeof document !== "undefined" && document.documentElement.lang === "ar" ? ar : en;
}

function mapOffer(offer: MarketplaceOffer): MarketplaceProduct {
  const stockStatus =
    !offer.isAvailable || offer.stock <= 0
      ? "out_of_stock"
      : offer.stock <= Math.max(offer.minOrder, 5)
        ? "low_stock"
        : "in_stock";
  return {
    id: offer.id,
    productId: offer.productId,
    offerType: offer.offerType,
    sku: offer.product.sku ?? offer.product.barcode ?? offer.product.id,
    name: localizedName(offer.product.tradeNameAr, offer.product.tradeNameEn),
    manufacturer: offer.product.manufacturer?.name ?? "—",
    categoryId: offer.product.categoryId,
    supplierId: offer.supplierId,
    supplierName: offer.supplier.name,
    price: Number(offer.price),
    moq: offer.minOrder,
    stock: offer.stock,
    stockStatus,
  };
}

function flattenCategories(nodes: CategoryNode[]): MarketplaceCategory[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: localizedName(node.nameAr, node.nameEn) },
    ...flattenCategories(node.children ?? []),
  ]);
}

export const marketplaceHttpRepository: MarketplaceRepository = {
  async listProducts(filters?: MarketplaceFilters) {
    const response = await apiRequest<Paged<MarketplaceOffer>>({
      method: "GET",
      url: "/marketplace/products",
      params: { q: filters?.search || undefined },
    });
    return response.data
      .map(mapOffer)
      .filter((item) => !filters?.categoryId || item.categoryId === filters.categoryId);
  },
  async getProduct(id: string) {
    const products = await this.listProducts();
    return products.find((product) => product.id === id);
  },
  async listCategories() {
    const categories = await apiRequest<CategoryNode[]>({ method: "GET", url: "/categories" });
    return flattenCategories(categories);
  },
};
