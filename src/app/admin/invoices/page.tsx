import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { dateFmt, money } from '@/lib/format';
export default async function Invoices() {
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const { data } = await sb.from('invoices').select('id,invoice_number,invoice_type,total,vat_amount,issued_at,zatca_status,orders(order_number,customer_name)').order('issued_at', { ascending: false }).limit(300);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{tr('أرشيف الفواتير', 'Invoice archive')}</h1>
      <p className="text-sm text-ink/60">{tr('الربط مع منصة فاتورة (زاتكا - المرحلة الثانية) غير مفعّل بعد ويتطلب شهادة CSID من زاتكا. لا يُعتبر النظام متوافقاً مع زاتكا حتى اجتياز اختبارات الربط.', 'ZATCA Fatoora (Phase 2) integration is not active yet and requires a ZATCA CSID. The system is not claimed to be ZATCA-compliant until onboarding tests pass.')}</p>
      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="table"><thead><tr><th>{tr('الرقم', 'Number')}</th><th>{tr('النوع', 'Type')}</th><th>{tr('الطلب', 'Order')}</th><th>{tr('الإجمالي', 'Total')}</th><th>{tr('الضريبة', 'VAT')}</th><th>{tr('التاريخ', 'Date')}</th><th>ZATCA</th></tr></thead>
          <tbody>{(data || []).map((v) => {
            const o = Array.isArray(v.orders) ? v.orders[0] : v.orders;
            return (
            <tr key={v.id}><td><Link href={`/invoice/${v.id}`} target="_blank" className="text-brand hover:underline" dir="ltr">{v.invoice_number}</Link></td><td>{v.invoice_type === 'credit_note' ? tr('إشعار دائن', 'Credit note') : tr('فاتورة', 'Invoice')}</td>
              <td dir="ltr">{o?.order_number}</td><td>{money(v.total, locale)}</td><td>{money(v.vat_amount, locale)}</td><td>{dateFmt(v.issued_at, locale)}</td><td className="text-xs">{v.zatca_status}</td></tr>);
          })}</tbody></table>
      </div>
    </div>
  );
}
