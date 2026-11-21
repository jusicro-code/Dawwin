import { createClient } from '@/lib/supabase/server';
import { L, periodRange } from '@/lib/admin';
import { money } from '@/lib/format';
import { PeriodTabs } from '@/components/admin/PeriodTabs';
import { CrudTable } from '@/components/admin/CrudTable';
export default async function Finance({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const { locale, L: tr } = await L();
  const r = periodRange(p);
  const sb = await createClient();
  const [{ data: f, error }, { data: expenses }] = await Promise.all([
    sb.rpc('admin_financial_report', { p_from: r.from, p_to: r.to }),
    sb.from('operating_expenses').select('*').order('incurred_on', { ascending: false }).limit(200),
  ]);
  if (error) return <p className="text-red-700">{error.message}</p>;
  const row = (k: string, v: number | null, strong = false) => <div className={`flex justify-between border-b border-sand-100 py-2 ${strong ? 'font-bold' : ''}`}><span>{k}</span><span>{v === null ? '—' : money(v, locale)}</span></div>;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{tr('التقارير المالية', 'Financial reports')}</h1><PeriodTabs active={r.key} /></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card text-sm" data-testid="finance-report">
          {row(tr('المبيعات الإجمالية (قيمة المواشي)', 'Gross sales (livestock)'), f.gross_sales)}
          {row(tr('إيراد الذبح والتجهيز', 'Preparation revenue'), f.preparation_revenue)}
          {row(tr('الخصومات', 'Discounts'), -f.discounts)}
          {row(tr('إيراد التوصيل', 'Delivery revenue'), f.delivery_revenue)}
          {row(tr('ضريبة القيمة المضافة المحصلة', 'VAT collected'), f.vat_collected)}
          {row(tr('إجمالي المحصّل', 'Total collected'), f.total_collected, true)}
          {row(tr('المبالغ المستردة', 'Refunds'), -f.refunds)}
          {row(tr('صافي المبيعات (بعد الضريبة والاسترداد)', 'Net sales (excl. VAT, after refunds)'), f.net_sales, true)}
          {row(tr('رسوم الدفع', 'Payment fees'), -f.payment_fees)}
          {row(tr('تكلفة المنتجات المدخلة', 'Entered product costs'), -f.product_costs)}
          {row(tr('المصروفات التشغيلية', 'Operating expenses'), -f.operating_expenses)}
          <div className="mt-3 rounded-xl bg-sand-100 p-3">
            <div className="flex justify-between font-bold"><span>{tr('صافي الربح التقديري', 'Estimated net profit')}</span><span>{f.estimated_net_profit === null ? '—' : money(f.estimated_net_profit, locale)}</span></div>
            {f.estimated_net_profit === null && <p className="mt-1 text-xs text-ink/60">{tr(`لا يُحتسب الربح لعدم إدخال تكلفة ${f.items_missing_cost} بند/بنود مبيعات. أدخل تكلفة الرأس في صفحة المنتج.`, `Profit is not calculated: ${f.items_missing_cost} sold line(s) have no unit cost. Enter unit costs on product pages.`)}</p>}
          </div>
          <p className="mt-3 text-xs text-ink/50">{tr(`عدد الطلبات المدفوعة في الفترة: ${f.orders}`, `Paid orders in period: ${f.orders}`)}</p>
        </section>
        <CrudTable table="operating_expenses" rows={expenses || []} title={{ ar: 'المصروفات التشغيلية', en: 'Operating expenses' }} fields={[
          { key: 'incurred_on', ar: 'التاريخ', en: 'Date', type: 'date', required: true }, { key: 'category', ar: 'البند', en: 'Category', required: true },
          { key: 'amount', ar: 'المبلغ', en: 'Amount', type: 'number', required: true }, { key: 'description', ar: 'الوصف', en: 'Description' },
        ]} />
      </div>
    </div>
  );
}
