import 'server-only';
import crypto from 'node:crypto';
import { serverEnv, isSandbox } from '../server-env';
import { SITE_URL } from '../env';
import { svc, type OrderRow } from './svc';

const base = () => serverEnv.tamara.baseUrl.replace(/\/$/, '');
const headers = () => ({ Authorization: `Bearer ${serverEnv.tamara.apiToken}`, 'Content-Type': 'application/json' });
const money = (n: number) => ({ amount: Number(Number(n).toFixed(2)), currency: 'SAR' });

export async function createTamaraCheckout(order: OrderRow, locale: 'ar' | 'en') {
  const a = order.delivery_address || {};
  const [first, ...rest] = order.customer_name.split(' ');
  const body = {
    order_reference_id: order.id, order_number: order.order_number, total_amount: money(order.total),
    description: `Order ${order.order_number}`, country_code: 'SA', payment_type: 'PAY_BY_INSTALMENTS', instalments: null,
    locale: locale === 'ar' ? 'ar_SA' : 'en_US',
    items: order.items.map((i) => ({ reference_id: i.product_id, type: 'Physical', name: i.product_name_en, sku: i.product_id, quantity: i.quantity, unit_price: money(i.unit_price), total_amount: money(i.line_subtotal) })),
    consumer: { first_name: first, last_name: rest.join(' ') || first, phone_number: order.customer_phone, email: order.customer_email || undefined },
    shipping_address: { first_name: first, last_name: rest.join(' ') || first, line1: [a.neighborhood, a.street].filter(Boolean).join(', ') || a.city || '', city: a.city || '', country_code: 'SA', phone_number: order.customer_phone },
    tax_amount: money(order.vat_amount), shipping_amount: money(order.delivery_fee),
    merchant_url: {
      success: `${SITE_URL}/api/payments/tamara/return?order=${order.id}`,
      failure: `${SITE_URL}/orders/${order.id}?payment=failed`,
      cancel: `${SITE_URL}/orders/${order.id}?payment=cancelled`,
      notification: `${SITE_URL}/api/webhooks/tamara`,
    },
  };
  const r = await fetch(`${base()}/checkout`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.checkout_url) return { error: 'tamara_rejected' as const };
  await svc('svc_attach_checkout', { p_order: order.id, p_provider: 'tamara', p_checkout_id: j.checkout_id, p_payment_id: j.order_id, p_amount: order.total, p_sandbox: isSandbox(serverEnv.tamara.baseUrl) });
  return { url: j.checkout_url as string };
}

async function getOrder(tamaraOrderId: string) {
  const r = await fetch(`${base()}/orders/${encodeURIComponent(tamaraOrderId)}`, { headers: headers(), cache: 'no-store' });
  if (!r.ok) throw new Error(`tamara fetch ${r.status}`);
  return r.json();
}

/** Verify with Tamara's API: approved -> authorise -> capture -> record as paid. */
export async function verifyTamaraOrder(tamaraOrderId: string) {
  let o = await getOrder(tamaraOrderId);
  const orderId: string | undefined = o.order_reference_id;
  if (!orderId) return { orderId: undefined, result: 'order_mismatch' };
  if (o.status === 'approved') {
    await fetch(`${base()}/orders/${encodeURIComponent(tamaraOrderId)}/authorise`, { method: 'POST', headers: headers() });
    o = await getOrder(tamaraOrderId);
  }
  if (o.status === 'authorised') {
    await fetch(`${base()}/payments/capture`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ order_id: tamaraOrderId, total_amount: o.total_amount, shipping_info: { shipped_at: new Date().toISOString(), shipping_company: 'Store delivery' } }),
    });
    o = await getOrder(tamaraOrderId);
  }
  const mapped = ['fully_captured', 'partially_captured', 'authorised'].includes(o.status) ? (o.status === 'authorised' ? 'authorized' : 'paid')
    : ['declined', 'expired', 'canceled'].includes(o.status) ? 'failed' : null;
  if (!mapped) return { orderId, result: 'pending' };
  if (o.total_amount?.currency !== 'SAR') return { orderId, result: 'currency_mismatch' };
  const res = await svc<{ result: string }>('svc_confirm_payment', {
    p_order: orderId, p_provider: 'tamara', p_provider_payment_id: tamaraOrderId, p_status: mapped,
    p_amount: Number(o.total_amount?.amount), p_fee: null, p_raw: o, p_sandbox: isSandbox(serverEnv.tamara.baseUrl),
  });
  return { orderId, result: res.result };
}

/** Tamara signs webhook notifications as an HS256 JWT (tamaraToken) using the notification token. */
export function verifyTamaraToken(token: string | null) {
  if (!token || !serverEnv.tamara.notificationToken) return false;
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return false;
  const expected = crypto.createHmac('sha256', serverEnv.tamara.notificationToken).update(`${h}.${p}`).digest('base64url');
  const a = Buffer.from(expected), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { const payload = JSON.parse(Buffer.from(p, 'base64url').toString()); return !payload.exp || payload.exp * 1000 > Date.now(); } catch { return false; }
}

export async function refundTamara(tamaraOrderId: string, amount: number, comment: string) {
  const r = await fetch(`${base()}/payments/simplified-refund/${encodeURIComponent(tamaraOrderId)}`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ total_amount: money(amount), comment: comment || 'Refund' }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.message || `tamara refund ${r.status}`);
  return { id: String(j.refund_id || tamaraOrderId) };
}
