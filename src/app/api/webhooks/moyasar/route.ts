import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv, providerConfigured } from '@/lib/server-env';
import { safeEqual, svc } from '@/lib/payments/svc';
import { verifyMoyasarPayment } from '@/lib/payments/moyasar';
export async function POST(req: NextRequest) {
  if (!providerConfigured.moyasar() || !serverEnv.moyasar.webhookSecret) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (!body?.id || !safeEqual(String(body.secret_token || ''), serverEnv.moyasar.webhookSecret)) return NextResponse.json({ error: 'invalid' }, { status: 401 });
  const { secret_token: _drop, ...safe } = body; void _drop;
  const isNew = await svc<boolean>('svc_record_payment_event', { p_provider: 'moyasar', p_event_id: String(body.id), p_type: body.type, p_signature_valid: true, p_payload: safe });
  if (!isNew) return NextResponse.json({ ok: true, duplicate: true });
  let err: string | null = null;
  try { if (body.data?.id && String(body.type).startsWith('payment_')) await verifyMoyasarPayment(String(body.data.id)); } catch (e) { err = (e as Error).message; }
  await svc('svc_mark_payment_event', { p_provider: 'moyasar', p_event_id: String(body.id), p_error: err });
  return NextResponse.json({ ok: !err }, { status: err ? 500 : 200 });
}
