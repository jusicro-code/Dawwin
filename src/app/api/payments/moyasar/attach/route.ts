import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { svc } from '@/lib/payments/svc';
import { serverEnv, isSandbox } from '@/lib/server-env';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/.test(body.order || '') || typeof body.payment_id !== 'string' || body.payment_id.length > 64) return NextResponse.json({ ok: false }, { status: 400 });
  const sb = await createClient();
  const { data: o } = await sb.from('orders').select('id,total,payment_method').eq('id', body.order).maybeSingle(); // RLS: own order only
  if (!o || o.payment_method !== 'moyasar') return NextResponse.json({ ok: false }, { status: 404 });
  await svc('svc_attach_checkout', { p_order: o.id, p_provider: 'moyasar', p_checkout_id: null, p_payment_id: body.payment_id, p_amount: o.total, p_sandbox: isSandbox(serverEnv.moyasar.secretKey) });
  return NextResponse.json({ ok: true });
}
