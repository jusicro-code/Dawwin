import { notFound, redirect } from 'next/navigation';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { serverEnv, providerConfigured } from '@/lib/server-env';
import { SITE_URL } from '@/lib/env';
import { money } from '@/lib/format';
import { MoyasarForm } from '@/components/MoyasarForm';

export const dynamic = 'force-dynamic';
const FORM_VERSION = process.env.MOYASAR_FORM_VERSION || '1.15.0';

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, t } = await getT();
  const sb = await createClient();
  const { data: o } = await sb.from('orders').select('id,order_number,total,status,payment_method,payment_status').eq('id', id).maybeSingle();
  if (!o) notFound();
  if (o.payment_method !== 'moyasar' || o.status !== 'awaiting_payment' || o.payment_status === 'paid' || !providerConfigured.moyasar()) redirect(`/orders/${id}`);
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <link rel="stylesheet" href={`https://cdn.moyasar.com/mpf/${FORM_VERSION}/moyasar.css`} />
      <Script src={`https://cdn.moyasar.com/mpf/${FORM_VERSION}/moyasar.js`} strategy="afterInteractive" />
      <h1 className="text-2xl font-bold">{t.pay_now}</h1>
      <p className="mt-1 text-sm text-ink/60">{t.order_number}: <span dir="ltr">{o.order_number}</span> · {money(o.total, locale)}</p>
      <div className="card mt-6">
        <MoyasarForm
          config={{
            amount: Math.round(Number(o.total) * 100), currency: 'SAR', description: `Order ${o.order_number}`,
            publishable_api_key: serverEnv.moyasar.publishableKey,
            callback_url: `${SITE_URL}/api/payments/moyasar/callback?order=${o.id}`,
            methods: ['creditcard', 'applepay'], supported_networks: ['mada', 'visa', 'mastercard'],
            metadata: { order_id: o.id, order_number: o.order_number }, language: locale,
            apple_pay: { country: 'SA', label: locale === 'ar' ? s.store_name_ar : s.store_name_en, validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate' },
          }}
          orderId={o.id}
        />
      </div>
      <p className="mt-4 text-xs text-ink/60">{t.awaiting_payment_note}</p>
    </div>
  );
}
