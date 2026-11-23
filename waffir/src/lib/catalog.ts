import { supabase } from './supabase';
import sample from '../data/sample.json';
import { Catalog } from '../types';

const sampleCatalog: Catalog = { ...(sample as Omit<Catalog, 'source'>), source: 'sample' };

/** يجيب البيانات من Supabase، ولو ما فيه اتصال يرجع للبيانات التجريبية */
export async function loadCatalog(): Promise<Catalog> {
  if (!supabase) return sampleCatalog;
  try {
    const [stores, categories, products, prices, ads] = await Promise.all([
      supabase.from('stores').select('*').order('sort'),
      supabase.from('categories').select('*').order('sort'),
      supabase.from('products').select('*').order('name'),
      supabase.from('prices').select('product_id, store_id, price, old_price'),
      supabase.from('ads').select('*').order('sort'),
    ]);
    const err = stores.error || categories.error || products.error || prices.error || ads.error;
    if (err || !stores.data?.length) throw err ?? new Error('empty');
    return {
      stores: stores.data,
      categories: categories.data ?? [],
      products: products.data ?? [],
      prices: (prices.data ?? []).map((p) => ({ ...p, price: Number(p.price), old_price: p.old_price == null ? null : Number(p.old_price) })),
      ads: ads.data ?? [],
      source: 'supabase',
    };
  } catch (e) {
    console.warn('Supabase غير متاح، نستخدم البيانات التجريبية', e);
    return sampleCatalog;
  }
}
