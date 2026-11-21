import 'server-only';
import { serverEnv, isSandbox } from '../server-env';
import { SITE_URL } from '../env';
import { svc, type OrderRow } from './svc';

const API = 'https://api.tabby.ai/api/v2';
const headers = () => ({ Authorization: `Bearer ${serverEnv.tabby.secretKey}`, 'Content-Type': 'application/json' });

export async function createTabbyCheckout(order: OrderRow, locale: 'ar' | 'en') {
  const a = order.delivery_address || {};
  const body = {
    payment: {
      amount: order.total.toFixed(2), currency: 'SAR', description: `Order ${order.order_number}`,
      buyer: { phone: order.customer_phone, email: order.customer_email || undefined, name: order.customer_name },
      shipping_address: { city: a.city || '', address: [a.neighborhood, a.street, a.building_details].filter(Boolean).join(', '), zip: a.national_address_short_code || '00000' },
      order: {
        reference_id: order.id, tax_amount: Number(order.vat_amount).toFixed(2), shipping_amount: Number(order.delivery_fee).toFixed(2),
        items: order.items.map((i) => ({ title: i.product_name_en, quantity: i.quantity, unit_price: Number(i.unit_price).toFixed(2), reference_id: i.product_id, category: 'Livestock' })),
      },
      buyer_history: { registered_since: order.created_at, loyalty_level: 0 },
    },
    lang: locale, merchant_code: serverEnv.tabby.merchantCode,
    merchant_urls: {
      success: `${SITE_URL}/api/payments/tabby/return?order=${order.id}`,
      cancel: `${SITE_URL}/orders/${order.id}?payment=cancelled`,
      failure: `${SITE_URL}/orders/${order.id}?payment=failed`,
    },
  };
  const r = await fetch(`${API}/checkout`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  const url = j?.configuration?.available_products?.installments?.[0]?.web_url;
  if (!r.ok || j.status === 'rejected' || !url) return { error: 'tabby_rejected' as const };
  await svc('svc_attach_checkout', { p_order: order.id, p_provider: 'tabby', p_checkout_id: j.id, p_payment_id: j.payment?.id, p_amount: order.total, p_sandbox: isSandbox(serverEnv.tabby.secretKey) });
  return { url: url as string };
}

async function getPayment(id: string) {
  const r = await fetch(`${API}/payments/${encodeURIComponent(id)}`, { headers: headers(), cache: 'no-store' });
  if (!r.ok) throw new Error(`tabby fetch ${r.status}`);
  return r.json();
}

/** Server-side verification: fetch payment, capture if authorized, then record. */
export async function verifyTabbyPayment(paymentId: string) {
  let p = await getPayment(paymentId);
  const orderId: string | undefined = p?.order?.reference_id;
  if (!orderId) return { orderId: undefined, result: 'order_mismatch' };
  if (p.currency !== 'SAR') return { orderId, result: 'currency_mismatch' };
  const status = String(p.status || '').toUpperCase();
  if (status === 'AUTHORIZED') {
    const c = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}/captures`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ amount: p.amount, reference_id: `cap-${orderId}` }),
    });
    if (c.ok) p = await getPayment(paymentId);
  }
  const s2 = String(p.status || '').toUpperCase();
  const mapped = s2 === 'CLOSED' ? 'paid' : s2 === 'AUTHORIZED' ? 'authorized' : ['REJECTED', 'EXPIRED'].includes(s2) ? 'failed' : null;
  if (!mapped) return { orderId, result: 'pending' };
  const res = await svc<{ result: string }>('svc_confirm_payment', {
    p_order: orderId, p_provider: 'tabby', p_provider_payment_id: paymentId, p_status: mapped,
    p_amount: Number(p.amount), p_fee: null, p_raw: p, p_sandbox: isSandbox(serverEnv.tabby.secretKey),
  });
  return { orderId, result: res.result };
}

export async function refundTabby(paymentId: string, amount: number) {
  const r = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}/refunds`, { method: 'POST', headers: headers(), body: JSON.stringify({ amount: amount.toFixed(2) }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `tabby refund ${r.status}`);
  return { id: String(j?.refunds?.at?.(-1)?.id || paymentId) };
}
