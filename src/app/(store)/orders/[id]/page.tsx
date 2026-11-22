import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { dateFmt, money, waLink } from '@/lib/format';
import { relevantFlow, statusColor, statusLabel } from '@/lib/status';
import { ReorderButton } from '@/components/ReorderButton';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { Check } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params; const sp = await searchParams;
  const { locale, t } = await getT();
  const sb = await createClient();
  const { data: o } = await sb.from('orders').select('*, order_items(*), order_status_history(*), delivery_assignments(*), invoices(id,invoice_number,invoice_type)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const s = await getSettings();
  const flow = relevantFlow(o.order_items.map((i: { preparation_code: string }) => i.preparation_code), o.payment_method);
  const reached = new Set(o.order_status_history.map((h: { to_status: string }) => h.to_status));
  const curIdx = flow.indexOf(o.status);
  const history = [...o.order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const addr = o.delivery_address || {};
  const da = Array.isArray(o.delivery_assignments) ? o.delivery_assignments[0] : o.delivery_assignments;
  const canPay = o.status === 'awaiting_payment' && o.payment_method !== 'cod' && !['paid', 'refunded'].includes(o.payment_status);
  const L = (ar: string, en: string) => (locale === 'ar' ? ar : en);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {sp.placed && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" data-testid="order-placed"><Check className="me-2 inline h-5 w-5" />{t.order_placed}</div>}
      {sp.payment === 'failed' || sp.payment_error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{L('لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى.', 'Payment was not completed. You can try again.')}</div> : null}
      {sp.payment === 'cancelled' && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">{L('تم إلغاء عملية الدفع.', 'Payment was cancelled.')}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-ink/60">{t.order_number}</div>
          <h1 className="text-2xl font-bold" dir="ltr" data-testid="order-number">{o.order_number}</h1>
        </div>
        <span className={`badge px-3 py-1 text-sm ${statusColor(o.status)}`} data-testid="order-status">{statusLabel(o.status, locale, o.payment_method)}</span>
      </div>

      {canPay && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/70">{t.awaiting_payment_note}</p>
          <Link href={`/api/payments/start?order=${o.id}`} prefetch={false} className="btn-primary">{t.pay_now}</Link>
        </div>
      )}
      {o.payment_method === 'cod' && o.status === 'awaiting_payment' && <p className="card mt-6 text-sm text-ink/70">{t.cod_note}</p>}

      {!['cancelled', 'refunded'].includes(o.status) && (
        <ol className="card mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3" aria-label={t.order_status}>
          {flow.map((st, i) => {
            const done = i <= curIdx || reached.has(st);
            return (
              <li key={st} className={`flex items-center gap-2 text-sm ${done ? 'text-ink' : 'text-ink/40'}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${done ? 'bg-brand text-white' : 'bg-sand-200'}`}>{done ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                {statusLabel(st, locale, o.payment_method)}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="card space-y-2 text-sm">
          <h2 className="mb-2 font-semibold">{t.order_details}</h2>
          {o.order_items.map((i: { id: string; product_name_ar: string; product_name_en: string; quantity: number; line_subtotal: number; preparation_name_ar: string; preparation_name_en: string; preparation_total: number; animal_tags: string[]; preparation_instructions: string | null }) => (
            <div key={i.id} className="border-b border-sand-100 pb-2">
              <div className="flex justify-between"><span>{L(i.product_name_ar, i.product_name_en)} × {i.quantity}</span><span>{money(i.line_subtotal, locale)}</span></div>
              <div className="flex justify-between text-xs text-ink/60"><span>{L(i.preparation_name_ar, i.preparation_name_en)}</span>{i.preparation_total > 0 && <span>{money(i.preparation_total, locale)}</span>}</div>
              {i.animal_tags.length > 0 && <div className="text-xs text-ink/60">{t.animal_tag}: {i.animal_tags.join(', ')}</div>}
              {i.preparation_instructions && <div className="text-xs text-ink/60">{i.preparation_instructions}</div>}
            </div>
          ))}
          <div className="space-y-1 pt-1">
            <Row k={t.subtotal} v={money(o.items_subtotal, locale)} />
            {o.bulk_discount > 0 && <Row k={t.bulk_discount} v={'− ' + money(o.bulk_discount, locale)} />}
            {o.coupon_discount > 0 && <Row k={`${t.coupon_discount} (${o.coupon_code})`} v={'− ' + money(o.coupon_discount, locale)} />}
            {o.preparation_total > 0 && <Row k={t.preparation_fees} v={money(o.preparation_total, locale)} />}
            <Row k={t.delivery_fee} v={o.delivery_fee > 0 ? money(o.delivery_fee, locale) : t.free} />
            {o.vat_amount > 0 && <Row k={`${t.vat} ${o.vat_rate}%${o.prices_include_vat ? ` (${t.vat_included})` : ''}`} v={money(o.vat_amount, locale)} />}
            <div className="flex justify-between border-t border-sand-200 pt-2 text-base font-bold"><span>{t.total}</span><span data-testid="order-total">{money(o.total, locale)}</span></div>
          </div>
        </section>
        <section className="card space-y-3 text-sm">
          <h2 className="font-semibold">{t.delivery_section}</h2>
          <p className="text-ink/80">{addr.recipient_name} · <span dir="ltr">{addr.recipient_phone}</span></p>
          <p className="text-ink/70">{[addr.city, addr.neighborhood, addr.street, addr.building_details].filter(Boolean).join('، ')}</p>
          <p><span className="text-ink/60">{t.schedule_section}:</span> {dateFmt(o.delivery_date, locale)} · <span dir="ltr">{o.delivery_window}</span></p>
          <p><span className="text-ink/60">{t.payment_section}:</span> {statusLabel(o.payment_method, locale)} — <span className={`badge ${statusColor(o.payment_status)}`}>{statusLabel(o.payment_status, locale)}</span></p>
          {da && <p><span className="text-ink/60">{t.driver}:</span> {da.driver_name} · <a href={`tel:${da.driver_phone}`} dir="ltr" className="text-brand">{da.driver_phone}</a></p>}
          {o.cancel_reason && <p className="text-red-700">{o.cancel_reason}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            {(o.invoices || []).map((inv: { id: string; invoice_number: string; invoice_type: string }) => (
              <Link key={inv.id} href={`/invoice/${inv.id}`} className="btn-outline text-xs">{t.view_invoice} {inv.invoice_number}</Link>
            ))}
            <ReorderButton items={o.order_items.map((i: { product_id: string; quantity: number; animal_ids: string[] }) => ({ productId: i.product_id, quantity: i.quantity }))} />
            <a href={waLink(s.whatsapp_number, `${L('استفسار عن الطلب', 'Question about order')} ${o.order_number}`)} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs"><WhatsAppIcon className="h-4 w-4 text-[#25D366]" />WhatsApp</a>
          </div>
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="mb-3 font-semibold">{t.order_history}</h2>
        <ul className="space-y-2 text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-2 border-b border-sand-100 pb-2">
              <span>{statusLabel(h.to_status, locale, o.payment_method)}{h.note ? <span className="text-ink/50"> — {h.note}</span> : null}</span>
              <span className="text-ink/50">{dateFmt(h.created_at, locale, true)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between"><span className="text-ink/70">{k}</span><span>{v}</span></div>; }
