'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, Quote } from '@/lib/types';
import { toQuoteItems, type CartLine } from './CartProvider';

export function useCartProducts(lines: CartLine[]) {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const ids = Array.from(new Set(lines.map((l) => l.productId))).sort().join(',');
  useEffect(() => {
    if (!ids) { setProducts({}); return; }
    createClient().from('products').select('*, product_images(*)').in('id', ids.split(',')).then(({ data }) => {
      const m: Record<string, Product> = {};
      (data || []).forEach((p: Product) => { p.product_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)); m[p.id] = p; });
      setProducts(m);
    });
  }, [ids]);
  return products;
}

export function useQuote(lines: CartLine[], coupon: string | null, zoneId: string | null) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([toQuoteItems(lines), coupon, zoneId]);
  useEffect(() => {
    if (lines.length === 0) { setQuote(null); return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data, error } = await createClient().rpc('quote_order', { p_items: toQuoteItems(lines), p_coupon: coupon, p_zone: zoneId });
      if (!cancelled) { setQuote(error ? null : (data as Quote)); setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { quote, loading };
}
