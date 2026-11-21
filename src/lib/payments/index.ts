import 'server-only';
import { providerConfigured } from '../server-env';
import type { Settings } from '../types';
import { getOrderTrusted } from './svc';
import { createTabbyCheckout } from './tabby';
import { createTamaraCheckout } from './tamara';
import { createClient } from '../supabase/server';

export type Method = 'cod' | 'moyasar' | 'tabby' | 'tamara';

/** A method is offered only if the owner enabled it AND server credentials exist (and BNPL merchant approval is recorded). */
export function availablePaymentMethods(s: Settings): Method[] {
  const m: Method[] = [];
  if (s.moyasar_enabled && providerConfigured.moyasar()) m.push('moyasar');
  if (s.tabby_enabled && s.tabby_merchant_approved && providerConfigured.tabby()) m.push('tabby');
  if (s.tamara_enabled && s.tamara_merchant_approved && providerConfigured.tamara()) m.push('tamara');
  if (s.cod_enabled) m.push('cod');
  return m;
}

export async function startOnlinePayment(orderId: string, locale: 'ar' | 'en'): Promise<{ url: string } | { error: string }> {
  // Ownership check through RLS, then trusted read for full details.
  const sb = await createClient();
  const { data: own } = await sb.from('orders').select('id,payment_method,status,payment_status').eq('id', orderId).maybeSingle();
  if (!own || own.status !== 'awaiting_payment' || ['paid', 'refunded'].includes(own.payment_status)) return { error: 'not_payable' };
  if (own.payment_method === 'moyasar') return providerConfigured.moyasar() ? { url: `/pay/${orderId}` } : { error: 'not_configured' };
  const order = await getOrderTrusted(orderId);
  if (!order) return { error: 'not_found' };
  if (own.payment_method === 'tabby' && providerConfigured.tabby()) return createTabbyCheckout(order, locale);
  if (own.payment_method === 'tamara' && providerConfigured.tamara()) return createTamaraCheckout(order, locale);
  return { error: 'not_configured' };
}
