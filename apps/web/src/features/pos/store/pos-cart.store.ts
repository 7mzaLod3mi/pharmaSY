import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InventoryProduct } from "../../inventory/api/inventory.types";

export interface PosCartLine {
  product: InventoryProduct;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface PosCartState {
  lines: PosCartLine[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  globalDiscount: { type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number };
  addLine: (product: InventoryProduct, quantity: number, unitPrice: number) => void;
  removeLine: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setLineDiscount: (productId: string, discount: number) => void;
  setCustomer: (name?: string, phone?: string) => void;
  setNotes: (notes?: string) => void;
  setGlobalDiscount: (type: "PERCENTAGE" | "FIXED_AMOUNT", value: number) => void;
  clear: () => void;
}

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set) => ({
      lines: [],
      globalDiscount: { type: "FIXED_AMOUNT", value: 0 },
      addLine: (product, quantity, unitPrice) =>
        set((state) => {
          const existing = state.lines.find((l) => l.product.id === product.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.product.id === product.id
                  ? { ...l, quantity: Math.min(product.availableQuantity, l.quantity + quantity) }
                  : l
              ),
            };
          }
          return { lines: [...state.lines, { product, quantity, unitPrice, discount: 0 }] };
        }),
      removeLine: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.product.id === productId ? { ...l, quantity: Math.max(1, quantity) } : l
          ),
        })),
      setLineDiscount: (productId, discount) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.product.id === productId ? { ...l, discount } : l)),
        })),
      setCustomer: (customerName, customerPhone) => set({ customerName, customerPhone }),
      setNotes: (notes) => set({ notes }),
      setGlobalDiscount: (type, value) => set({ globalDiscount: { type, value } }),
      clear: () =>
        set({
          lines: [],
          customerName: undefined,
          customerPhone: undefined,
          notes: undefined,
          globalDiscount: { type: "FIXED_AMOUNT", value: 0 },
        }),
    }),
    { name: "pharmasy-pos-cart" }
  )
);
