import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { dateFmt, money } from '@/lib/format';
import { statusColor, statusLabel } from '@/lib/status';

const ACTIVE = ['paid', 'confirmed', 'preparing', 'slaughtering', 'cleaning_cutting', 'packaging', 'ready_for_delivery', 'out_for_delivery'];
export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string; page?: string }> }) {
  const sp = await searchParams;
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  let q = sb.from('orders').select('id,order_number,status,payment_method,payment_status,customer_name,customer_phone,total,delivery_date,delivery_window,delivery_status,created_at', { count: 'exact' })
    .order('created_at', { ascending: false }).range((page - 1) * 50, page * 50 - 1);
  if (sp.status === 'active') q = q.in('status', ACTIVE); else if (sp.status) q = q.eq('status', sp.status);
  if (sp.q) { const s = sp.q.replace(/[%,()]/g, '').trim(); if (s) q = q.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`); }
  if (sp.from) q = q.gte('delivery_date', sp.from);
  if (sp.to) q = q.lte('delivery_date', sp.to);
  const { data, count } = await q;
  const statuses = ['awaiting_payment', 'active', ...ACTIVE, 'delivered', 'cancelled', 'refunded'];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{tr('الطلبات', 'Orders')} <span className="text-base font-normal text-ink/50">({count ?? 0})</span></h1>
      <form className="card grid gap-3 p-4 sm:grid-cols-5">
        <input name="q" defaultValue={sp.q} placeholder={tr('رقم الطلب، الاسم، الجوال', 'Order no., name, phone')} className="input sm:col-span-2" />
        <select name="status" defaultValue={sp.status || ''} className="input">
          <option value="">{tr('كل الحالات', 'All statuses')}</option>
          {statuses.map((s) => <option key={s} value={s}>{s === 'active' ? tr('قيد التنفيذ', 'In progress') : statusLabel(s, locale)}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="input" aria-label="from" />
        <div className="flex gap-2"><input type="date" name="to" defaultValue={sp.to} className="input" aria-label="to" /><button className="btn-primary">{tr('بحث', 'Filter')}</button></div>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="table" data-testid="admin-orders-table">
          <thead><tr><th>{tr('الطلب', 'Order')}</th><th>{tr('العميل', 'Customer')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('الدفع', 'Payment')}</th><th>{tr('التوصيل', 'Delivery')}</th><th>{tr('الإجمالي', 'Total')}</th><th>{tr('التاريخ', 'Created')}</th></tr></thead>
          <tbody>
            {(data || []).map((o) => (
              <tr key={o.id} className="hover:bg-sand-50">
                <td><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline" dir="ltr">{o.order_number}</Link></td>
                <td>{o.customer_name}<div className="text-xs text-ink/50" dir="ltr">{o.customer_phone}</div></td>
                <td><span className={`badge ${statusColor(o.status)}`}>{statusLabel(o.status, locale, o.payment_method)}</span></td>
                <td>{statusLabel(o.payment_method, locale)}<div><span className={`badge ${statusColor(o.payment_status)}`}>{statusLabel(o.payment_status, locale)}</span></div></td>
                <td>{dateFmt(o.delivery_date, locale)}<div className="text-xs text-ink/50" dir="ltr">{o.delivery_window}</div></td>
                <td className="font-semibold">{money(o.total, locale)}</td>
                <td className="text-xs text-ink/60">{dateFmt(o.created_at, locale, true)}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} className="text-center text-ink/50">—</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        {page > 1 && <Link className="btn-outline" href={`?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`}>←</Link>}
        {(count || 0) > page * 50 && <Link className="btn-outline" href={`?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`}>→</Link>}
      </div>
    </div>
  );
}
