import 'server-only';
import { serverEnv, isSandbox } from '../server-env';
import { getOrderTrusted, svc } from './svc';

const API = 'https://api.moyasar.com/v1';
const auth = () => 'Basic ' + Buffer.from(serverEnv.moyasar.secretKey + ':').toString('base64');

type MoyasarPayment = { id: string; status: string; amount: number; fee?: number; currency: string; metadata?: Record<string, string>; source?: { type?: string } };

export async function fetchPayment(id: string): Promise<MoyasarPayment> {
  const r = await fetch(`${API}/payments/${encodeURIComponent(id)}`, { headers: { Authorization: auth() }, cache: 'no-store' });
  if (!r.ok) throw new Error(`moyasar fetch ${r.status}`);
  return r.json();
}

/** Fetches the payment from Moyasar (never trusts the browser) and records the verified result. */
export async function verifyMoyasarPayment(paymentId: string, expectedOrderId?: string) {
  const p = await fetchPayment(paymentId);
  const orderId = p.metadata?.order_id;
  if (!orderId || (expectedOrderId && orderId !== expectedOrderId)) return { orderId: expectedOrderId, result: 'order_mismatch' };
  const order = await getOrderTrusted(orderId);
  if (!order) return { orderId, result: 'order_not_found' };
  if (p.currency !== 'SAR') return { orderId, result: 'currency_mismatch' };
  const status = p.status === 'paid' || p.status === 'captured' ? 'paid' : p.status === 'authorized' ? 'authorized'
    : ['failed', 'voided'].includes(p.status) ? 'failed' : 'pending';
  if (status === 'pending') return { orderId, result: 'pending' };
  const res = await svc<{ result: string }>('svc_confirm_payment', {
    p_order: orderId, p_provider: 'moyasar', p_provider_payment_id: p.id, p_status: status,
    p_amount: p.amount / 100, p_fee: p.fee != null ? p.fee / 100 : null, p_raw: p, p_sandbox: isSandbox(serverEnv.moyasar.secretKey),
  });
  return { orderId, result: res.result };
}

export async function refundMoyasar(paymentId: string, amountSar: number) {
  const r = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST', headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amountSar * 100) }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.message || `moyasar refund ${r.status}`);
  return { id: String(body.id || paymentId) };
}
