import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS, type Product } from "@/data/products";

export type CartLine = {
  productId: number;
  variant: number;
  qty: number;
};

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (productId: number, variant?: number, qty?: number) => void;
  setQty: (productId: number, variant: number, qty: number) => void;
  remove: (productId: number, variant: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "smol-cart-v1";
const CartContext = createContext<CartValue | null>(null);

export function priceOf(product: Product): number {
  return Number(product.price.replace(/[^0-9.]/g, "")) || 0;
}

export function productById(id: number): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed.filter((l) => l && typeof l.productId === "number"));
      }
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore full storage */
    }
  }, [lines]);

  const add = useCallback((productId: number, variant = 0, qty = 1) => {
    setLines((current) => {
      const found = current.find((l) => l.productId === productId && l.variant === variant);
      if (found) {
        return current.map((l) => (l === found ? { ...l, qty: l.qty + qty } : l));
      }
      return [...current, { productId, variant, qty }];
    });
  }, []);

  const setQty = useCallback((productId: number, variant: number, qty: number) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((l) => !(l.productId === productId && l.variant === variant))
        : current.map((l) => (l.productId === productId && l.variant === variant ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: number, variant: number) => {
    setLines((current) => current.filter((l) => !(l.productId === productId && l.variant === variant)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => {
      const product = productById(l.productId);
      return product ? sum + priceOf(product) * l.qty : sum;
    }, 0);
    return { lines, count, subtotal, add, setQty, remove, clear };
  }, [lines, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const SHIPPING = 6;
export function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
