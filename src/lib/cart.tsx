"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { track } from "@/lib/track";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  size: string;
  color?: string;
  priceCents: number;
  qty: number;
};

// Duas linhas da sacola são a mesma só se produto + tamanho + cor baterem.
const sameLine = (
  a: { productId: string; size: string; color?: string },
  b: { productId: string; size: string; color?: string },
) => a.productId === b.productId && a.size === b.size && a.color === b.color;

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string, size: string, color?: string) => void;
  setQty: (productId: string, size: string, qty: number, color?: string) => void;
  clear: () => void;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hypado:cart:v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => sameLine(i, item));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { ...item, qty }];
    });
    track("add_to_cart", {
      productId: item.productId,
      meta: { size: item.size, color: item.color, qty, priceCents: item.priceCents },
    });
  }, []);

  const remove = useCallback((productId: string, size: string, color?: string) => {
    setItems((prev) =>
      prev.filter((i) => !sameLine(i, { productId, size, color })),
    );
  }, []);

  const setQty = useCallback(
    (productId: string, size: string, qty: number, color?: string) => {
      setItems((prev) =>
        prev
          .map((i) =>
            sameLine(i, { productId, size, color })
              ? { ...i, qty: Math.max(0, qty) }
              : i,
          )
          .filter((i) => i.qty > 0),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotalCents = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
    return { items, count, subtotalCents, add, remove, setQty, clear, hydrated };
  }, [items, add, remove, setQty, clear, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
