import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { L, periodRange } from '@/lib/admin';
import { money } from '@/lib/format';
import { PeriodTabs } from '@/components/admin/PeriodTabs';

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const { locale, L: tr } = await L();
  const r = periodRange(p);
  const sb = await createClient();
  await sb.rpc('run_maintenance');
  const { data: d, error } = await sb.rpc('admin_dashboard', { p_from: r.from, p_to: r.to });
  if (error || !d) return <p className="text-red-700">{error?.message}</p>;
  const series = (d.series || []) as { day: string; sales: number; orders: number }[];
  const max = Math.max(1, ...series.map((x) => Number(x.sales)));
  const kpi = (label: string, v: string | number, href?: string) => {
    const inner = <><div className="text-xs text-ink/60">{label}</div><div className="mt-1 text-2xl font-bold">{v}</div></>;
    return href ? <Link href={href} className="card hover:border-brand">{inner}</Link> : <div className="card">{inner}</div>;
  };
  return (
    <div className="space-y-6" data-testid="admin-overview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr('نظرة عامة', 'Overview')}</h1>
        <PeriodTabs active={r.key} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi(tr('إجمالي المبيعات (مدفوعة)', 'Total sales (paid)'), money(d.gross_sales, locale))}
        {kpi(tr('إجمالي الطلبات', 'Total orders'), d.total_orders, '/admin/orders')}
        {kpi(tr('بانتظار الدفع/التأكيد', 'Pending'), d.awaiting_payment, '/admin/orders?status=awaiting_payment')}
        {kpi(tr('قيد التنفيذ', 'In progress'), d.in_progress, '/admin/orders?status=active')}
        {kpi(tr('مكتملة', 'Completed'), d.completed, '/admin/orders?status=delivered')}
        {kpi(tr('ملغاة', 'Cancelled'), d.cancelled, '/admin/orders?status=cancelled')}
        {kpi(tr('رؤوس مباعة', 'Animals sold'), d.animals_sold)}
        {kpi(tr('المخزون المتاح (رؤوس)', 'Available inventory'), d.inventory_units, '/admin/products')}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 font-semibold">{tr('المبيعات اليومية', 'Daily sales')}</div>
          {series.length === 0 ? <p className="text-sm text-ink/50">—</p> : (
            <div className="flex h-48 items-end gap-1.5" role="img" aria-label="sales chart">
              {series.map((x) => (
                <div key={x.day} className="group relative flex-1">
                  <div className="rounded-t bg-brand/80 group-hover:bg-brand" style={{ height: `${Math.max(4, (Number(x.sales) / max) * 180)}px` }} />
                  <div className="pointer-events-none absolute bottom-full start-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-white group-hover:block">{x.day}: {money(x.sales, locale)} · {x.orders}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="mb-3 font-semibold">{tr('الأكثر مبيعاً', 'Best sellers')}</div>
          <ul className="space-y-2 text-sm">{(d.best_sellers || []).map((b: { product_id: string; name_ar: string; name_en: string; qty: number; revenue: number }) => (
            <li key={b.product_id} className="flex justify-between"><span>{locale === 'ar' ? b.name_ar : b.name_en}</span><span className="text-ink/60">{b.qty} · {money(b.revenue, locale)}</span></li>
          ))}{!d.best_sellers?.length && <li className="text-ink/50">—</li>}</ul>
          <div className="mb-3 mt-6 font-semibold text-amber-800">{tr('تنبيهات انخفاض المخزون', 'Low-stock alerts')}</div>
          <ul className="space-y-2 text-sm">{(d.low_stock || []).map((b: { id: string; name_ar: string; name_en: string; stock: number }) => (
            <li key={b.id} className="flex justify-between"><Link href={`/admin/products/${b.id}`} className="hover:text-brand">{locale === 'ar' ? b.name_ar : b.name_en}</Link><span className="badge bg-amber-50 text-amber-800">{b.stock}</span></li>
          ))}{!d.low_stock?.length && <li className="text-ink/50">—</li>}</ul>
        </div>
      </div>
    </div>
  );
}
