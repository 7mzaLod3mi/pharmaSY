import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketplaceProduct } from "../api/marketplace.types";

export interface CartItem {
  product: MarketplaceProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: MarketplaceProduct, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  clearSupplier: (supplierId: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),
      clearCart: () => set({ items: [] }),
      clearSupplier: (supplierId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.supplierId !== supplierId),
        })),
    }),
    {
      name: "pharmasyn-cart",
    }
  )
);
