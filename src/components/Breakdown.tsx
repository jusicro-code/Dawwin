'use client';
import { useT } from '@/lib/i18n/client';
import { money } from '@/lib/format';
import type { Quote } from '@/lib/types';
export function Breakdown({ q, showDeliveryPending }: { q: Quote; showDeliveryPending?: boolean }) {
  const { t, locale } = useT();
  const row = (label: string, v: number | string, neg = false, testid?: string) => (
    <div className="flex justify-between text-sm"><span className="text-ink/70">{label}</span><span data-testid={testid} className={neg ? 'text-emerald-700' : ''}>{typeof v === 'number' ? (neg ? '− ' : '') + money(v, locale) : v}</span></div>
  );
  return (
    <div className="space-y-2" data-testid="breakdown">
      {row(t.subtotal, q.items_subtotal)}
      {q.bulk_discount > 0 && row(t.bulk_discount, q.bulk_discount, true)}
      {q.coupon_discount > 0 && row(`${t.coupon_discount}${q.coupon_code ? ` (${q.coupon_code})` : ''}`, q.coupon_discount, true)}
      {q.preparation_total > 0 && row(t.preparation_fees, q.preparation_total)}
      {showDeliveryPending ? row(t.delivery_fee, t.calculated_at_checkout) : row(t.delivery_fee, q.delivery_fee === 0 ? t.free : q.delivery_fee)}
      {q.vat_enabled && q.vat_rate && (q.prices_include_vat
        ? row(`${t.vat} ${q.vat_rate}% (${t.vat_included})`, q.vat_amount)
        : row(`${t.vat} ${q.vat_rate}%`, q.vat_amount))}
      <div className="flex justify-between border-t border-sand-200 pt-3 text-base font-bold"><span>{t.total}</span><span data-testid="quote-total">{money(q.total, locale)}</span></div>
    </div>
  );
}
