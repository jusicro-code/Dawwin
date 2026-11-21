import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { errorText } from '@/lib/errors';
import { getLocale } from '@/lib/i18n/server';
import { providerConfigured } from '@/lib/server-env';
import { refundMoyasar } from '@/lib/payments/moyasar';
import { refundTabby } from '@/lib/payments/tabby';
import { refundTamara } from '@/lib/payments/tamara';

const schema = z.object({ order_id: z.string().uuid(), amount: z.number().positive(), reason: z.string().trim().min(2).max(500), restock: z.boolean(), manual: z.boolean().optional() });

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: locale === 'ar' ? 'بيانات غير صالحة' : 'Invalid input' }, { status: 400 });
  const sb = await createClient();
  const { data: roles } = await sb.rpc('my_roles');
  if (!(roles as string[] | null)?.some((r) => r === 'owner' || r === 'admin')) return NextResponse.json({ error: errorText('forbidden', locale) }, { status: 403 });
  const { order_id, amount, reason, restock, manual } = parsed.data;
  const { data: o } = await sb.from('orders').select('id,payment_method,payment_status').eq('id', order_id).single();
  const { data: pay } = await sb.from('payments').select('provider_payment_id,status').eq('order_id', order_id).in('status', ['paid', 'partially_refunded']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  let providerRef: string | null = null;
  let status: 'manual' | 'succeeded' = 'manual';
  if (o && o.payment_method !== 'cod' && !manual) {
    if (!pay?.provider_payment_id) return NextResponse.json({ error: locale === 'ar' ? 'لا يوجد دفع إلكتروني لاسترداده' : 'No online payment found' }, { status: 400 });
    try {
      if (o.payment_method === 'moyasar' && providerConfigured.moyasar()) providerRef = (await refundMoyasar(pay.provider_payment_id, amount)).id;
      else if (o.payment_method === 'tabby' && providerConfigured.tabby()) providerRef = (await refundTabby(pay.provider_payment_id, amount)).id;
      else if (o.payment_method === 'tamara' && providerConfigured.tamara()) providerRef = (await refundTamara(pay.provider_payment_id, amount, reason)).id;
      else return NextResponse.json({ error: locale === 'ar' ? 'مزود الدفع غير مهيأ' : 'Payment provider not configured' }, { status: 400 });
      status = 'succeeded';
    } catch (e) {
      return NextResponse.json({ error: `${locale === 'ar' ? 'رفض مزود الدفع الاسترداد' : 'Provider refused refund'}: ${(e as Error).message}` }, { status: 502 });
    }
  }
  const { error } = await sb.rpc('admin_record_refund', { p_order: order_id, p_amount: amount, p_reason: reason, p_restock: restock, p_provider_refund_id: providerRef, p_status: status });
  if (error) return NextResponse.json({ error: errorText(error, locale) }, { status: 400 });
  return NextResponse.json({ ok: true });
}
