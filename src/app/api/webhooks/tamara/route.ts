import { NextResponse, type NextRequest } from 'next/server';
import { providerConfigured } from '@/lib/server-env';
import { svc } from '@/lib/payments/svc';
import { verifyTamaraOrder, verifyTamaraToken } from '@/lib/payments/tamara';
export async function POST(req: NextRequest) {
  if (!providerConfigured.tamara()) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const token = req.nextUrl.searchParams.get('tamaraToken') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!verifyTamaraToken(token)) return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.order_id) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const eventId = `${body.order_id}:${body.event_type || body.order_status}`;
  const isNew = await svc<boolean>('svc_record_payment_event', { p_provider: 'tamara', p_event_id: eventId, p_type: body.event_type || body.order_status, p_signature_valid: true, p_payload: body });
  if (!isNew) return NextResponse.json({ ok: true, duplicate: true });
  let err: string | null = null;
  try { await verifyTamaraOrder(String(body.order_id)); } catch (e) { err = (e as Error).message; }
  await svc('svc_mark_payment_event', { p_provider: 'tamara', p_event_id: eventId, p_error: err });
  return NextResponse.json({ ok: !err }, { status: err ? 500 : 200 });
}
