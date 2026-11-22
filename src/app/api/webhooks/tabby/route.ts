import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv, providerConfigured } from '@/lib/server-env';
import { safeEqual, svc } from '@/lib/payments/svc';
import { verifyTabbyPayment } from '@/lib/payments/tabby';
// Tabby lets the merchant register a webhook with a custom auth header; we compare it in constant time.
export async function POST(req: NextRequest) {
  if (!providerConfigured.tabby() || !serverEnv.tabby.webhookSecret) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const header = req.headers.get(process.env.TABBY_WEBHOOK_HEADER || 'x-webhook-secret') || '';
  if (!safeEqual(header, serverEnv.tabby.webhookSecret)) return NextResponse.json({ error: 'invalid' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const eventId = `${body.id}:${body.status}:${body.captures?.length || 0}:${body.refunds?.length || 0}`;
  const isNew = await svc<boolean>('svc_record_payment_event', { p_provider: 'tabby', p_event_id: eventId, p_type: body.status, p_signature_valid: true, p_payload: body });
  if (!isNew) return NextResponse.json({ ok: true, duplicate: true });
  let err: string | null = null;
  try { await verifyTabbyPayment(String(body.id)); } catch (e) { err = (e as Error).message; }
  await svc('svc_mark_payment_event', { p_provider: 'tabby', p_event_id: eventId, p_error: err });
  return NextResponse.json({ ok: !err }, { status: err ? 500 : 200 });
}
