'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartLine = { key: string; productId: string; quantity: number; prep: string; animalIds: string[]; instructions: string };
type Ctx = {
  lines: CartLine[]; count: number; ready: boolean;
  add: (productId: string, quantity: number, animalIds?: string[]) => void;
  setQty: (key: string, q: number) => void; setPrep: (key: string, prep: string) => void;
  setInstructions: (key: string, s: string) => void; remove: (key: string) => void; clear: () => void;
};
const CartCtx = createContext<Ctx | null>(null);
const STORAGE = 'cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE); if (raw) setLines(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(STORAGE, JSON.stringify(lines)); } catch { /* ignore */ } }, [lines, ready]);

  const add = useCallback((productId: string, quantity: number, animalIds: string[] = []) => {
    setLines((prev) => {
      if (animalIds.length === 0) {
        const ex = prev.find((l) => l.productId === productId && l.animalIds.length === 0 && l.prep === 'live');
        if (ex) return prev.map((l) => (l === ex ? { ...l, quantity: Math.min(l.quantity + quantity, 100) } : l));
      }
      return [...prev, { key: crypto.randomUUID(), productId, quantity: animalIds.length || quantity, prep: 'live', animalIds, instructions: '' }];
    });
  }, []);
  const upd = (key: string, f: (l: CartLine) => CartLine) => setLines((p) => p.map((l) => (l.key === key ? f(l) : l)));
  const value = useMemo<Ctx>(() => ({
    lines, ready, count: lines.reduce((s, l) => s + l.quantity, 0), add,
    setQty: (k, q) => upd(k, (l) => (l.animalIds.length ? l : { ...l, quantity: Math.max(1, Math.min(100, Math.floor(q) || 1)) })),
    setPrep: (k, prep) => upd(k, (l) => ({ ...l, prep })),
    setInstructions: (k, s) => upd(k, (l) => ({ ...l, instructions: s.slice(0, 500) })),
    remove: (k) => setLines((p) => p.filter((l) => l.key !== k)),
    clear: () => setLines([]),
  }), [lines, ready, add]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error('CartProvider missing');
  return c;
}
export function toQuoteItems(lines: CartLine[]) {
  return lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, preparation_code: l.prep, animal_ids: l.animalIds, instructions: l.instructions }));
}
