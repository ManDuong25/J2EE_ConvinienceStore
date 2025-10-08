import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Product } from "../types";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isSidebarOpen: boolean;
  lastOrderId?: number;
  addToCart: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  toggleSidebar: (open?: boolean) => void;
  setLastOrderId: (id?: number) => void;
};

const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        isSidebarOpen: false,
        lastOrderId: undefined,
        addToCart: (product) => {
          const { items } = get();
          const existing = items.find((item) => item.product.id === product.id);
          if (existing) {
            set({
              items: items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQty) }
                  : item
              )
            });
          } else {
            set({
              items: [...items, { product, quantity: 1 }]
            });
          }
        },
        updateQuantity: (productId, quantity) => {
          const sanitized = Math.max(1, quantity);
          set((state) => ({
            items: state.items
              .map((item) =>
                item.product.id === productId
                  ? { ...item, quantity: Math.min(sanitized, item.product.stockQty) }
                  : item
              )
              .filter((item) => item.quantity > 0)
          }));
        },
        removeFromCart: (productId) =>
          set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) })),
        clearCart: () => set({ items: [] }),
        toggleSidebar: (open) =>
          set((state) => ({ isSidebarOpen: open ?? !state.isSidebarOpen })),
        setLastOrderId: (id) => set({ lastOrderId: id })
      }),
      {
        name: "convenience-store-cart"
      }
    )
  )
);

export default useCartStore;
export type { CartItem };

