import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { dateFmt, money } from '@/lib/format';
export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const { data } = await sb.rpc('admin_customers', { p_search: q || null, p_limit: 200, p_offset: 0 });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{tr('العملاء', 'Customers')}</h1>
      <form className="flex max-w-md gap-2"><input name="q" defaultValue={q} className="input" placeholder={tr('الاسم، البريد، الجوال', 'Name, email, phone')} /><button className="btn-primary">{tr('بحث', 'Search')}</button></form>
      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="table"><thead><tr><th>{tr('العميل', 'Customer')}</th><th>{tr('الجوال', 'Phone')}</th><th>{tr('النوع', 'Type')}</th><th>{tr('الطلبات', 'Orders')}</th><th>{tr('إجمالي الإنفاق', 'Total spent')}</th><th>{tr('آخر طلب', 'Last order')}</th></tr></thead>
          <tbody>{(data || []).map((c: { id: string; full_name: string | null; email: string; phone: string | null; customer_type: string; orders_count: number; total_spent: number; last_order_at: string | null }) => (
            <tr key={c.id}><td><Link className="font-semibold text-brand hover:underline" href={`/admin/customers/${c.id}`}>{c.full_name || '—'}</Link><div className="text-xs text-ink/50" dir="ltr">{c.email}</div></td><td dir="ltr">{c.phone}</td>
              <td>{c.customer_type === 'wholesale' ? tr('جملة', 'Wholesale') : tr('تجزئة', 'Retail')}</td><td>{c.orders_count}</td><td>{money(c.total_spent, locale)}</td><td className="text-xs">{dateFmt(c.last_order_at, locale)}</td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
