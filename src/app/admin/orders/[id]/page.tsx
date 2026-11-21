import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { dateFmt, money, waLink } from '@/lib/format';
import { relevantFlow, statusColor, statusLabel } from '@/lib/status';
import { OrderActions } from '@/components/admin/OrderActions';

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const { data: o } = await sb.from('orders').select('*, order_items(*), order_status_history(*), delivery_assignments(*), order_internal_notes(*), payments(*), refunds(*), invoices(id,invoice_number,invoice_type,total,issued_at)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const [{ data: personnel }, { data: roles }] = await Promise.all([
    sb.from('delivery_personnel').select('id,full_name,phone').eq('is_active', true).order('full_name'), sb.rpc('my_roles'),
  ]);
  const flow = relevantFlow(o.order_items.map((i: { preparation_code: string }) => i.preparation_code), o.payment_method);
  const curIdx = flow.indexOf(o.status);
  const next = ['cancelled', 'refunded', 'delivered'].includes(o.status) ? [] : flow.slice(curIdx + 1).filter((s) => s !== 'paid');
  const addr = o.delivery_address || {};
  const da = Array.isArray(o.delivery_assignments) ? o.delivery_assignments[0] : o.delivery_assignments;
  const refunded = (o.refunds || []).filter((r: { status: string }) => r.status !== 'failed').reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0);
  const isAdmin = ((roles as string[]) || []).some((r) => r === 'owner' || r === 'admin');
  const history = [...o.order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <div className="space-y-6" data-testid="admin-order">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link href="/admin/orders" className="text-sm text-brand">← {tr('الطلبات', 'Orders')}</Link><h1 className="text-2xl font-bold" dir="ltr">{o.order_number}</h1><div className="text-sm text-ink/60">{dateFmt(o.created_at, locale, true)}</div></div>
        <div className="flex gap-2"><span className={`badge px-3 py-1 text-sm ${statusColor(o.status)}`} data-testid="admin-order-status">{statusLabel(o.status, locale, o.payment_method)}</span><span className={`badge px-3 py-1 text-sm ${statusColor(o.payment_status)}`}>{statusLabel(o.payment_status, locale)}</span></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="card text-sm">
            <h2 className="mb-3 font-semibold">{tr('المنتجات والخدمات', 'Items & services')}</h2>
            <table className="table"><thead><tr><th>{tr('المنتج', 'Product')}</th><th>{tr('الكمية', 'Qty')}</th><th>{tr('السعر', 'Unit')}</th><th>{tr('التجهيز', 'Preparation')}</th><th>{tr('الإجمالي', 'Total')}</th></tr></thead>
              <tbody>{o.order_items.map((i: { id: string; product_name_ar: string; product_name_en: string; quantity: number; unit_price: number; line_subtotal: number; preparation_name_ar: string; preparation_name_en: string; preparation_total: number; preparation_instructions: string | null; animal_tags: string[] }) => (
                <tr key={i.id}><td>{locale === 'ar' ? i.product_name_ar : i.product_name_en}{i.animal_tags.length > 0 && <div className="text-xs text-ink/50">{tr('أرقام الرؤوس', 'Animal IDs')}: {i.animal_tags.join(', ')}</div>}</td><td>{i.quantity}</td><td>{money(i.unit_price, locale)}</td>
                  <td>{locale === 'ar' ? i.preparation_name_ar : i.preparation_name_en}{i.preparation_total > 0 && <div className="text-xs">{money(i.preparation_total, locale)}</div>}{i.preparation_instructions && <div className="text-xs text-amber-800">{i.preparation_instructions}</div>}</td><td>{money(i.line_subtotal, locale)}</td></tr>
              ))}</tbody></table>
            <div className="ms-auto mt-4 max-w-xs space-y-1">
              {[[tr('المجموع', 'Subtotal'), o.items_subtotal], [tr('خصم الكمية', 'Bulk discount'), -o.bulk_discount], [`${tr('كوبون', 'Coupon')} ${o.coupon_code || ''}`, -o.coupon_discount], [tr('التجهيز', 'Preparation'), o.preparation_total], [tr('التوصيل', 'Delivery'), o.delivery_fee], [`${tr('الضريبة', 'VAT')} ${o.vat_rate ?? ''}%`, o.vat_amount]].filter(([, v]) => Number(v) !== 0).map(([k, v]) => (
                <div key={String(k)} className="flex justify-between"><span className="text-ink/60">{k}</span><span>{money(Number(v), locale)}</span></div>
              ))}
              <div className="flex justify-between border-t pt-1 font-bold"><span>{tr('الإجمالي', 'Total')}</span><span>{money(o.total, locale)}</span></div>
              {refunded > 0 && <div className="flex justify-between text-violet-700"><span>{tr('مسترد', 'Refunded')}</span><span>{money(refunded, locale)}</span></div>}
            </div>
          </section>
          <OrderActions order={{ id: o.id, status: o.status, payment_method: o.payment_method, payment_status: o.payment_status, total: Number(o.total), refunded, hasInvoice: (o.invoices || []).some((x: { invoice_type: string }) => x.invoice_type === 'invoice') }}
            next={next} personnel={personnel || []} assignment={da || null} notes={o.order_internal_notes || []} isAdmin={isAdmin} />
          <section className="card text-sm">
            <h2 className="mb-3 font-semibold">{tr('سجل الحالة', 'Status history')}</h2>
            <ul className="space-y-1.5">{history.map((h) => (
              <li key={h.id} className="flex justify-between gap-2 border-b border-sand-100 pb-1.5"><span>{h.from_status ? `${statusLabel(h.from_status, locale)} → ` : ''}<b>{statusLabel(h.to_status, locale)}</b>{h.note && <span className="text-ink/50"> — {h.note}</span>}</span><span className="text-ink/50">{dateFmt(h.created_at, locale, true)}</span></li>
            ))}</ul>
          </section>
        </div>
        <div className="space-y-6">
          <section className="card space-y-2 text-sm">
            <h2 className="font-semibold">{tr('العميل', 'Customer')}</h2>
            <div>{o.customer_name}</div>
            <div className="flex gap-2" dir="ltr"><a href={`tel:${o.customer_phone}`} className="text-brand">{o.customer_phone}</a> · <a href={waLink(o.customer_phone, `${tr('بخصوص طلبك', 'About your order')} ${o.order_number}`)} target="_blank" rel="noopener noreferrer" className="text-[#1f9d55]">WhatsApp</a></div>
            {o.customer_email && <div dir="ltr">{o.customer_email}</div>}
            <Link href={`/admin/customers/${o.user_id}`} className="text-brand">{tr('ملف العميل', 'Customer profile')} →</Link>
            {o.customer_note && <p className="rounded-lg bg-amber-50 p-2 text-amber-900">{o.customer_note}</p>}
          </section>
          <section className="card space-y-1.5 text-sm">
            <h2 className="font-semibold">{tr('التوصيل', 'Delivery')}</h2>
            <div>{addr.recipient_name} · <span dir="ltr">{addr.recipient_phone}</span></div>
            <div className="text-ink/70">{[addr.zone_city_ar && (locale === 'ar' ? addr.zone_city_ar : addr.zone_city_en), addr.city, addr.neighborhood, addr.street, addr.building_details].filter(Boolean).join('، ')}</div>
            {addr.national_address_short_code && <div dir="ltr">{addr.national_address_short_code}</div>}
            {addr.latitude && <a className="text-brand" target="_blank" rel="noopener noreferrer" href={`https://maps.google.com/?q=${addr.latitude},${addr.longitude}`}>{tr('الموقع على الخريطة', 'Map location')}</a>}
            {addr.delivery_instructions && <p className="text-amber-800">{addr.delivery_instructions}</p>}
            <div><b>{dateFmt(o.delivery_date, locale)}</b> · <span dir="ltr">{o.delivery_window}</span></div>
            <div>{tr('حالة التوصيل', 'Delivery status')}: <span className={`badge ${statusColor(o.delivery_status)}`}>{statusLabel(o.delivery_status, locale)}</span></div>
            {da && <div>{tr('المندوب', 'Driver')}: {da.driver_name} · <span dir="ltr">{da.driver_phone}</span></div>}
          </section>
          <section className="card space-y-2 text-sm">
            <h2 className="font-semibold">{tr('المدفوعات', 'Payments')}</h2>
            <div>{statusLabel(o.payment_method, locale)}</div>
            {(o.payments || []).map((p: { id: string; provider: string; status: string; amount: number; provider_payment_id: string | null; is_sandbox: boolean; verified_at: string | null }) => (
              <div key={p.id} className="rounded-lg border border-sand-200 p-2 text-xs"><div className="flex justify-between"><span dir="ltr">{p.provider_payment_id || '—'}</span><span className={`badge ${statusColor(p.status)}`}>{p.status}</span></div><div>{money(p.amount, locale)} {p.is_sandbox && <span className="badge bg-amber-50 text-amber-800">sandbox</span>} {p.verified_at && `· ${tr('تم التحقق', 'verified')} ${dateFmt(p.verified_at, locale, true)}`}</div></div>
            ))}
            {(o.refunds || []).map((r: { id: string; amount: number; status: string; reason: string | null }) => <div key={r.id} className="text-xs text-violet-700">{tr('استرداد', 'Refund')}: {money(r.amount, locale)} · {r.status} · {r.reason}</div>)}
          </section>
          <section className="card space-y-2 text-sm">
            <h2 className="font-semibold">{tr('الفواتير', 'Invoices')}</h2>
            {(o.invoices || []).map((v: { id: string; invoice_number: string; invoice_type: string; total: number }) => (
              <Link key={v.id} href={`/invoice/${v.id}`} target="_blank" className="flex justify-between text-brand hover:underline"><span dir="ltr">{v.invoice_number}</span><span>{v.invoice_type === 'credit_note' ? tr('إشعار دائن', 'Credit note') : tr('فاتورة', 'Invoice')} · {money(v.total, locale)}</span></Link>
            ))}
            {!o.invoices?.length && <p className="text-ink/50">{tr('تصدر الفاتورة تلقائياً عند الدفع أو التسليم.', 'Issued automatically on payment or delivery.')}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
