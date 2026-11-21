'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, toQuoteItems } from './CartProvider';
import { useCartProducts, useQuote } from './useCartData';
import { useT } from '@/lib/i18n/client';
import { fill } from '@/lib/i18n/dict';
import { money, waLink } from '@/lib/format';
import { codeText } from '@/lib/errors';
import { placeOrder } from '@/app/actions/checkout';
import { Breakdown } from './Breakdown';
import { AddressForm, type Zone } from './AddressForm';
import { WhatsAppIcon } from './WhatsAppIcon';
import type { PrepService } from '@/lib/types';

type Address = { id: string; label: string | null; recipient_name: string; recipient_phone: string; zone_id: string; city: string; neighborhood: string; street: string | null; is_default: boolean };
type Slot = { id: string; zone_id: string | null; weekday: number | null; start_time: string; end_time: string; min_lead_hours: number; is_active: boolean };
type Method = 'cod' | 'moyasar' | 'tabby' | 'tamara';

function riyadhNow() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value || '00';
  return new Date(`${g('year')}-${g('month')}-${g('day')}T${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}:00`);
}
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function CheckoutForm(props: {
  settings: { whatsapp: string }; profile: { name: string; phone: string; email: string };
  addresses: Address[]; zones: Zone[]; slots: Slot[]; blackouts: string[]; services: PrepService[]; methods: Method[];
}) {
  const { t, locale } = useT();
  const router = useRouter();
  const cart = useCart();
  const products = useCartProducts(cart.lines);
  const [addresses, setAddresses] = useState(props.addresses);
  const [addressId, setAddressId] = useState(props.addresses[0]?.id || '');
  const [showNewAddr, setShowNewAddr] = useState(props.addresses.length === 0);
  const [name, setName] = useState(props.profile.name);
  const [phone, setPhone] = useState(props.profile.phone ? '0' + props.profile.phone.slice(4) : '');
  const [email, setEmail] = useState(props.profile.email);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);
  const [method, setMethod] = useState<Method | ''>(props.methods[0] || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idem = useRef<string>(typeof crypto !== 'undefined' ? crypto.randomUUID() : '');

  const address = addresses.find((a) => a.id === addressId);
  const zoneId = address?.zone_id || null;
  const { quote, loading } = useQuote(cart.lines, coupon, zoneId);
  const L = (ar?: string | null, en?: string | null) => (locale === 'ar' ? ar : en) || '';

  const days = useMemo(() => {
    const now = riyadhNow();
    return Array.from({ length: 14 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() + i); return d; })
      .filter((d) => !props.blackouts.includes(ymd(d)));
  }, [props.blackouts]);
  const slotsFor = (d: string) => {
    if (!d) return [];
    const day = new Date(d + 'T00:00:00');
    const now = riyadhNow();
    return props.slots.filter((s) => s.is_active && (s.zone_id === null || s.zone_id === zoneId) && (s.weekday === null || s.weekday === day.getDay())
      && new Date(`${d}T${s.start_time}`).getTime() >= now.getTime() + s.min_lead_hours * 3600_000);
  };
  const slotOptions = slotsFor(date);

  const enabledServices = props.services.filter((s) => s.is_enabled && (s.code === 'live' || s.owner_confirmed_authorized));

  if (!cart.ready) return <div className="mx-auto max-w-page px-4 py-16 text-center text-ink/60">{t.loading}</div>;
  if (cart.lines.length === 0) return (
    <div className="mx-auto max-w-page px-4 py-20 text-center"><h1 className="text-2xl font-bold">{t.cart_empty}</h1><Link href="/products" className="btn-primary mt-6">{t.continue_shopping}</Link></div>
  );

  const waText = (locale === 'ar' ? 'السلام عليكم، أرغب بطلب:\n' : 'Hello, I would like to order:\n') +
    cart.lines.map((l) => { const p = products[l.productId]; return `- ${p ? L(p.name_ar, p.name_en) : ''} × ${l.quantity}`; }).join('\n') +
    (quote ? `\n${t.total}: ${money(quote.total, locale)}` : '');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!addressId) return setError(codeText('ADDRESS_REQUIRED', locale));
    if (!date || !slotId) return setError(codeText('SLOT_UNAVAILABLE', locale));
    if (!method) return setError(t.no_payment_methods);
    if (!quote || quote.errors.length) return setError(quote?.errors[0] ? codeText(quote.errors[0].code, locale) : t.error);
    setBusy(true);
    const res = await placeOrder({
      idempotency_key: idem.current, items: toQuoteItems(cart.lines), coupon_code: coupon, address_id: addressId,
      delivery_date: date, slot_id: slotId, payment_method: method, customer_name: name, customer_phone: phone,
      customer_email: email, customer_note: note, expected_total: quote.total,
    });
    if (res.error) { setError(res.error); setBusy(false); if (res.error.includes('السعر') || res.error.includes('Price')) idem.current = crypto.randomUUID(); return; }
    cart.clear();
    if (res.redirect?.startsWith('http')) window.location.href = res.redirect; else router.push(res.redirect || `/orders/${res.orderId}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-page px-4 py-10" data-testid="checkout-form">
      <h1 className="text-2xl font-bold md:text-3xl">{t.checkout}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card space-y-4">
            <h2 className="font-semibold">{t.contact_section}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label><span className="label">{t.full_name}</span><input required name="customer_name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label><span className="label">{t.phone}</span><input required name="customer_phone" dir="ltr" inputMode="tel" placeholder="05xxxxxxxx" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
              <label><span className="label">{t.email}</span><input type="email" name="customer_email" dir="ltr" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            </div>
          </section>

          <section className="card space-y-4">
            <div><h2 className="font-semibold">{t.delivery_section}</h2><p className="text-xs text-ink/60">{t.delivery_only}</p></div>
            {addresses.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`cursor-pointer rounded-xl border p-3 text-sm ${a.id === addressId ? 'border-brand bg-brand-soft' : 'border-sand-300'}`}>
                    <input type="radio" name="address" className="sr-only" checked={a.id === addressId} onChange={() => { setAddressId(a.id); setSlotId(''); }} />
                    <div className="font-semibold">{a.label || a.recipient_name}</div>
                    <div className="text-ink/70">{a.city} · {a.neighborhood}{a.street ? ` · ${a.street}` : ''}</div>
                    <div className="text-ink/50" dir="ltr">{a.recipient_phone}</div>
                  </label>
                ))}
              </div>
            )}
            {showNewAddr ? (
              <AddressForm zones={props.zones} defaults={{ recipient_name: name, recipient_phone: phone }}
                onSaved={(a) => { setAddresses((x) => [a as Address, ...x]); setAddressId(a.id); setShowNewAddr(false); }}
                onCancel={addresses.length ? () => setShowNewAddr(false) : undefined} />
            ) : <button type="button" className="btn-outline" onClick={() => setShowNewAddr(true)}>+ {t.add_address}</button>}
          </section>

          <section className="card space-y-4">
            <h2 className="font-semibold">{t.schedule_section}</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((d) => {
                const v = ymd(d); const has = slotsFor(v).length > 0;
                return (
                  <button type="button" key={v} disabled={!has} data-testid="date-option" onClick={() => { setDate(v); setSlotId(''); }}
                    className={`min-w-20 rounded-xl border px-3 py-2 text-center text-sm disabled:opacity-40 ${date === v ? 'border-brand bg-brand-soft text-brand' : 'border-sand-300 bg-white'}`}>
                    <div className="text-xs">{d.toLocaleDateString(locale === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { weekday: 'short' })}</div>
                    <div className="font-semibold">{d.toLocaleDateString(locale === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { day: 'numeric', month: 'short' })}</div>
                  </button>
                );
              })}
            </div>
            {date && (
              <div className="flex flex-wrap gap-2">
                {slotOptions.map((s) => (
                  <button type="button" key={s.id} data-testid="slot-option" onClick={() => setSlotId(s.id)}
                    className={`rounded-xl border px-4 py-2 text-sm ${slotId === s.id ? 'border-brand bg-brand-soft text-brand' : 'border-sand-300 bg-white'}`} dir="ltr">
                    {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card space-y-4">
            <div><h2 className="font-semibold">{t.prep_section}</h2><p className="text-xs text-ink/60">{t.prep_hint}</p></div>
            {cart.lines.map((l) => {
              const p = products[l.productId];
              return (
                <div key={l.key} className="rounded-xl border border-sand-200 p-3">
                  <div className="mb-2 text-sm font-semibold">{p ? L(p.name_ar, p.name_en) : '…'} × {l.quantity}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {enabledServices.map((s) => (
                      <label key={s.id} className={`cursor-pointer rounded-lg border p-2.5 text-sm ${l.prep === s.code ? 'border-brand bg-brand-soft' : 'border-sand-300'}`}>
                        <input type="radio" className="sr-only" name={`prep-${l.key}`} checked={l.prep === s.code} onChange={() => cart.setPrep(l.key, s.code)} />
                        <div className="flex justify-between gap-2"><span className="font-medium">{L(s.name_ar, s.name_en)}</span><span>{Number(s.price) === 0 ? t.free : `+${money(s.price, locale)}`}</span></div>
                        {L(s.description_ar, s.description_en) && <div className="mt-0.5 text-xs text-ink/60">{L(s.description_ar, s.description_en)}</div>}
                        {s.estimated_minutes ? <div className="text-xs text-ink/50">{fill(t.est_time, { n: s.estimated_minutes })}</div> : null}
                      </label>
                    ))}
                  </div>
                  {l.prep !== 'live' && (
                    <input className="input mt-2 text-sm" placeholder={t.prep_instructions} value={l.instructions} maxLength={500} onChange={(e) => cart.setInstructions(l.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </section>

          <section className="card space-y-3">
            <h2 className="font-semibold">{t.payment_section}</h2>
            {props.methods.length === 0 ? <p className="text-sm text-red-700">{t.no_payment_methods}</p> : props.methods.map((m) => (
              <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${method === m ? 'border-brand bg-brand-soft' : 'border-sand-300'}`}>
                <input type="radio" name="payment_method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-[var(--brand)]" />
                <span className="font-medium">{t[`pm_${m}` as const]}</span>
              </label>
            ))}
            <p className="text-xs text-ink/60">{method === 'cod' ? t.cod_note : t.awaiting_payment_note}</p>
            <label className="block"><span className="label">{t.note}</span><textarea className="input min-h-20" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          </section>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card space-y-4">
            <div className="font-semibold">{t.cost_breakdown}</div>
            <div className="flex gap-2">
              <input className="input" placeholder={t.coupon} value={couponInput} onChange={(e) => setCouponInput(e.target.value)} aria-label={t.coupon} />
              <button type="button" className="btn-outline" onClick={() => setCoupon(couponInput.trim() || null)}>{t.apply}</button>
            </div>
            {quote?.coupon_error && coupon && <p className="text-xs text-red-600">{codeText(quote.coupon_error, locale)}</p>}
            {quote ? <Breakdown q={quote} showDeliveryPending={!zoneId} /> : <p className="text-sm text-ink/60">{t.loading}</p>}
            {quote?.errors.map((er, i) => <p key={i} className="text-xs text-red-600">{codeText(er.code, locale)}</p>)}
            {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700" role="alert" data-testid="checkout-error">{error}</p>}
            <button type="submit" data-testid="place-order" disabled={busy || loading || !method || !!quote?.errors.length || (!!coupon && !!quote?.coupon_error)} className="btn-primary w-full py-3.5 text-base">
              {busy ? t.placing : t.place_order}
            </button>
          </div>
          <a href={waLink(props.settings.whatsapp, waText)} target="_blank" rel="noopener noreferrer" data-testid="checkout-whatsapp" className="btn-outline w-full py-3">
            <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />{t.whatsapp_checkout}
          </a>
        </aside>
      </div>
    </form>
  );
}
