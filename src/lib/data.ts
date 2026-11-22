import 'server-only';
import { cache } from 'react';
import { createClient } from './supabase/server';
import type { Category, Product, Settings } from './types';

export const PRODUCT_SELECT = '*, product_images(*), categories(slug,name_ar,name_en)';

export const getSettings = cache(async (): Promise<Settings> => {
  const sb = await createClient();
  const { data } = await sb.from('store_settings').select('*').eq('id', 1).single();
  return data as Settings;
});
export const getCategories = cache(async (): Promise<Category[]> => {
  const sb = await createClient();
  const { data } = await sb.from('categories').select('*').eq('is_active', true).order('sort_order');
  return (data || []) as Category[];
});
export async function getProducts(opts: { category?: string; q?: string; featured?: boolean; newArrivals?: boolean; offers?: boolean; ids?: string[] } = {}) {
  const sb = await createClient();
  let query = sb.from('products').select(PRODUCT_SELECT).eq('is_hidden', false).eq('is_archived', false).order('sort_order');
  if (opts.category) {
    const cats = await getCategories();
    const c = cats.find((x) => x.slug === opts.category);
    if (c) query = query.eq('category_id', c.id);
  }
  if (opts.q) {
    const q = opts.q.replace(/[%,()]/g, ' ').trim().slice(0, 60);
    if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,description_ar.ilike.%${q}%,description_en.ilike.%${q}%`);
  }
  if (opts.featured) query = query.eq('is_featured', true);
  if (opts.newArrivals) query = query.eq('is_new_arrival', true);
  if (opts.offers) query = query.not('compare_at_price', 'is', null);
  if (opts.ids) query = query.in('id', opts.ids);
  const { data } = await query;
  return sortMedia((data || []) as Product[]);
}
export function sortMedia(list: Product[]) {
  list.forEach((p) => p.product_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
  return list;
}
export async function getUser() {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  return data.user;
}
export async function getRoles(): Promise<string[]> {
  const sb = await createClient();
  const { data } = await sb.rpc('my_roles');
  return (data as string[]) || [];
}
export async function getBestSellerIds(limit = 4): Promise<string[]> {
  // Aggregated server-side through a public-safe view is unnecessary: use the dashboard-free heuristic of featured order.
  const sb = await createClient();
  const { data } = await sb.rpc('best_seller_ids', { p_limit: limit });
  return ((data as { product_id: string }[]) || []).map((r) => r.product_id);
}
