import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { dateFmt, money } from '@/lib/format';
import { statusColor, statusLabel } from '@/lib/status';
import { CrudTable } from '@/components/admin/CrudTable';
export default async function Customer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const [{ data: p }, { data: orders }, { data: addrs }, { data: notes }, { data: list }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', id).maybeSingle(),
    sb.from('orders').select('id,order_number,status,payment_method,payment_status,total,created_at').eq('user_id', id).order('created_at', { ascending: false }),
    sb.from('delivery_addresses').select('*').eq('user_id', id),
    sb.from('customer_notes').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    sb.rpc('admin_customers', { p_search: null, p_limit: 200, p_offset: 0 }),
  ]);
  if (!p) notFound();
  const email = ((list || []) as { id: string; email: string }[]).find((c) => c.id === id)?.email;
  const spent = (orders || []).filter((o) => ['paid', 'partially_refunded'].includes(o.payment_status)).reduce((s, o) => s + Number(o.total), 0);
  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm text-brand">← {tr('العملاء', 'Customers')}</Link>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><div className="text-xs text-ink/60">{tr('العميل', 'Customer')}</div><div className="font-bold">{p.full_name || '—'}</div><div className="text-sm" dir="ltr">{email}</div><div className="text-sm" dir="ltr">{p.phone}</div></div>
        <div className="card"><div className="text-xs text-ink/60">{tr('الطلبات', 'Orders')}</div><div className="text-2xl font-bold">{orders?.length || 0}</div></div>
        <div className="card"><div className="text-xs text-ink/60">{tr('إجمالي الإنفاق', 'Total spent')}</div><div className="text-2xl font-bold">{money(spent, locale)}</div></div>
      </div>
      <CrudTable table="profiles" rows={[p]} canCreate={false} canDelete={false} title={{ ar: 'نوع العميل', en: 'Customer type' }} fields={[
        { key: 'full_name', ar: 'الاسم', en: 'Name' },
        { key: 'customer_type', ar: 'النوع', en: 'Type', type: 'select', options: [{ value: 'retail', ar: 'تجزئة', en: 'Retail' }, { value: 'wholesale', ar: 'جملة (أسعار الجملة)', en: 'Wholesale (wholesale prices)' }] },
      ]} />
      <section className="card text-sm"><h2 className="mb-2 font-semibold">{tr('سجل المشتريات', 'Purchase history')}</h2>
        <table className="table"><tbody>{(orders || []).map((o) => (
          <tr key={o.id}><td><Link className="text-brand" href={`/admin/orders/${o.id}`} dir="ltr">{o.order_number}</Link></td><td><span className={`badge ${statusColor(o.status)}`}>{statusLabel(o.status, locale, o.payment_method)}</span></td><td>{money(o.total, locale)}</td><td>{dateFmt(o.created_at, locale)}</td></tr>
        ))}</tbody></table></section>
      <section className="card text-sm"><h2 className="mb-2 font-semibold">{tr('العناوين', 'Addresses')}</h2>
        {(addrs || []).map((a) => <div key={a.id} className="border-b border-sand-100 py-1.5">{[a.city, a.neighborhood, a.street].filter(Boolean).join('، ')} · <span dir="ltr">{a.recipient_phone}</span></div>)}</section>
      <CrudTable table="customer_notes" rows={notes || []} defaults={{ customer_id: id }} title={{ ar: 'ملاحظات الدعم', en: 'Support notes' }} fields={[{ key: 'note', ar: 'الملاحظة', en: 'Note', type: 'textarea', required: true }]} />
    </div>
  );
}
