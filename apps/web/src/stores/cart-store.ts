import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  supplierProductId?: string;
  marketplaceOfferId?: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  moq: number;
  maxStock: number;
}

interface CartState {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  removeLine: (productId: string, supplierId: string) => void;
  setQuantity: (productId: string, supplierId: string, quantity: number) => void;
  clear: () => void;
}

/**
 * Cart is genuinely client-only UI state (survives refresh via localStorage)
 * — a good fit for Zustand. Do NOT mirror server-fetched catalog/order data
 * in here; that belongs to TanStack Query's cache instead.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find(
            (l) => l.productId === line.productId && l.supplierId === line.supplierId
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l === existing ? { ...l, quantity: Math.min(l.maxStock, l.quantity + line.quantity) } : l
              ),
            };
          }
          return { lines: [...state.lines, line] };
        }),
      removeLine: (productId, supplierId) =>
        set((state) => ({
          lines: state.lines.filter((l) => !(l.productId === productId && l.supplierId === supplierId)),
        })),
      setQuantity: (productId, supplierId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.productId === productId && l.supplierId === supplierId
              ? { ...l, quantity: Math.max(l.moq, Math.min(l.maxStock, quantity)) }
              : l
          ),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: "pharmasy-cart" }
  )
);

/** Cart lines grouped by supplier — every checkout becomes N supplier orders. */
export function groupCartBySupplier(lines: CartLine[]) {
  const groups = new Map<string, CartLine[]>();
  for (const line of lines) {
    const group = groups.get(line.supplierId) ?? [];
    group.push(line);
    groups.set(line.supplierId, group);
  }
  return groups;
}
