import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { dateFmt } from '@/lib/format';
export default async function Notifications() {
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const { data } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{tr('الإشعارات', 'Notifications')}</h1>
      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="table"><thead><tr><th>{tr('القناة', 'Channel')}</th><th>{tr('الجمهور', 'Audience')}</th><th>{tr('المحتوى', 'Content')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('التاريخ', 'Date')}</th></tr></thead>
          <tbody>{(data || []).map((n) => (
            <tr key={n.id}><td>{n.channel}</td><td>{n.audience}</td><td>{locale === 'ar' ? n.body_ar : n.body_en}{n.order_id && <> · <Link href={`/admin/orders/${n.order_id}`} className="text-brand">{tr('الطلب', 'Order')}</Link></>}{n.error && <div className="text-xs text-red-700">{n.error}</div>}</td><td>{n.status}</td><td className="text-xs">{dateFmt(n.created_at, locale, true)}</td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
