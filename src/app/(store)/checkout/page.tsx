import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettings, getUser } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { availablePaymentMethods } from '@/lib/payments';
import { CheckoutForm } from '@/components/CheckoutForm';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { const { t } = await getT(); return { title: t.checkout }; }

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/checkout');
  const sb = await createClient();
  const [s, { data: profile }, { data: addresses }, { data: zones }, { data: slots }, { data: blackouts }, { data: services }] = await Promise.all([
    getSettings(),
    sb.from('profiles').select('*').eq('id', user.id).single(),
    sb.from('delivery_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
    sb.from('delivery_zones').select('*').order('sort_order'),
    sb.from('delivery_slots').select('*').order('start_time'),
    sb.from('delivery_blackout_dates').select('day'),
    sb.from('preparation_services').select('*').order('sort_order'),
  ]);
  return (
    <CheckoutForm
      settings={{ whatsapp: s.whatsapp_number }}
      profile={{ name: profile?.full_name || '', phone: profile?.phone || '', email: user.email || '' }}
      addresses={addresses || []} zones={zones || []} slots={slots || []}
      blackouts={(blackouts || []).map((b) => b.day)} services={services || []}
      methods={availablePaymentMethods(s)}
    />
  );
}
