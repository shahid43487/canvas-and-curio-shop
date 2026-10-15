import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";

export type CartVariation = { id: string; name: string; price: number };

export type CartItem = {
  product: Product;
  quantity: number;
  variation?: CartVariation | undefined;
};

export const itemKey = (i: CartItem) => `${i.product.id}:${i.variation?.id ?? ""}`;
export const unitPrice = (i: CartItem) => i.variation?.price ?? i.product.price;

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variation?: CartVariation) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = "smol-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(CART_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt cart
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1, variation?: CartVariation) => {
    const key = itemKey({ product, quantity, variation });
    setItems((prev) => {
      const currentMode = prev[0]?.product.is_hidden === true;
      const nextMode = product.is_hidden === true;
      if (prev.length > 0 && currentMode !== nextMode) {
        return [{ product, quantity, variation }];
      }
      if (prev.some((i) => itemKey(i) === key)) {
        return prev.map((i) => (itemKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { product, quantity, variation }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => itemKey(i) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => itemKey(i) !== key));
      return;
    }
    setItems((prev) => prev.map((i) => (itemKey(i) === key ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
