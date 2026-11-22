import 'server-only';
import { createAnonClient } from '../supabase/server';
import { serverEnv } from '../server-env';

/** Trusted server-side RPCs. They require INTERNAL_RPC_SECRET, verified inside Postgres. */
export async function svc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!serverEnv.internalSecret) throw new Error('INTERNAL_RPC_SECRET not configured');
  const { data, error } = await createAnonClient().rpc(fn, { p_secret: serverEnv.internalSecret, ...args });
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}
export type OrderRow = {
  id: string; order_number: string; user_id: string; status: string; payment_method: 'cod' | 'moyasar' | 'tabby' | 'tamara';
  payment_status: string; total: number; vat_amount: number; delivery_fee: number; customer_name: string; customer_phone: string;
  customer_email: string | null; delivery_address: Record<string, string | null>; created_at: string;
  items: Array<{ product_id: string; product_name_ar: string; product_name_en: string; quantity: number; unit_price: number; line_subtotal: number }>;
};
export const getOrderTrusted = (orderId: string) => svc<OrderRow | null>('svc_get_order', { p_order: orderId });
export function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
