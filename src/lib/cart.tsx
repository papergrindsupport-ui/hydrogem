import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BottleColorKey, BottleKind, BottleSize, CrystalShape } from "./hydrogem";

export interface CartItem {
  id: string;
  kind: BottleKind;
  name: string;
  colorKey: BottleColorKey;
  colorName: string;
  crystalShape: CrystalShape;
  size: BottleSize;
  letter: string | null;
  price: number;
  priceWas: number;
  qty: number;
}

const STORAGE_KEY = "hydrogem.bag.v1";

export function cartItemId(
  kind: BottleKind,
  colorKey: string,
  crystalShape: string,
  size: string,
  letter: string | null,
) {
  return [kind, colorKey, crystalShape, size, letter ?? "none"].join("|");
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  totalWas: number;
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  has: (id: string) => boolean;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev : [...prev, { ...item, qty: 1 }],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((a, i) => a + i.qty, 0);
    const total = items.reduce((a, i) => a + i.qty * i.price, 0);
    const totalWas = items.reduce((a, i) => a + i.qty * i.priceWas, 0);
    return {
      items,
      count,
      total,
      totalWas,
      add,
      remove,
      setQty,
      has: (id: string) => items.some((i) => i.id === id),
      clear: () => setItems([]),
      open,
      setOpen,
    };
  }, [items, add, remove, setQty, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const KD = (n: number) => `${n.toFixed(2)} KD`;
