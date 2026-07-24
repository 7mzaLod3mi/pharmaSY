export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  overview: () => [...inventoryQueryKeys.all, "overview"] as const,
  products: () => [...inventoryQueryKeys.all, "products"] as const,
  product: (id: string) => [...inventoryQueryKeys.all, "product", id] as const,
  movements: (productId?: string) => [...inventoryQueryKeys.all, "movements", productId ?? "all"] as const,
};
