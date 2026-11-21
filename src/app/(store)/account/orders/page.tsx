import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { dateFmt, money } from '@/lib/format';
import { statusColor, statusLabel } from '@/lib/status';
export const dynamic = 'force-dynamic';
export default async function MyOrders() {
  const { locale, t } = await getT();
  const sb = await createClient();
  const { data } = await sb.from('orders').select('id,order_number,status,payment_method,total,created_at,delivery_date').order('created_at', { ascending: false }).limit(100);
  if (!data?.length) return <div className="card text-ink/60">{t.no_orders}</div>;
  return (
    <ul className="space-y-3" data-testid="my-orders">
      {data.map((o) => (
        <li key={o.id}><Link href={`/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-brand">
          <div><div className="font-semibold" dir="ltr">{o.order_number}</div><div className="text-xs text-ink/60">{dateFmt(o.created_at, locale, true)}</div></div>
          <span className={`badge ${statusColor(o.status)}`}>{statusLabel(o.status, locale, o.payment_method)}</span>
          <span className="font-bold">{money(o.total, locale)}</span>
        </Link></li>
      ))}
    </ul>
  );
}
