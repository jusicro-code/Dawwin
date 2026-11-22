'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n/client';
import { saveAddress } from '@/app/actions/checkout';

export type Zone = { id: string; city_ar: string; city_en: string; fee: number };
type Saved = { id: string; [k: string]: unknown };

/** Not a <form> element so it can be embedded inside the checkout form. */
export function AddressForm({ zones, defaults, initial, onSaved, onCancel }: {
  zones: Zone[]; defaults?: { recipient_name?: string; recipient_phone?: string };
  initial?: Record<string, string | number | boolean | null>; onSaved: (a: Saved) => void; onCancel?: () => void;
}) {
  const { t, locale } = useT();
  const [v, setV] = useState<Record<string, string | boolean>>(() => ({
    label: '', recipient_name: defaults?.recipient_name || '', recipient_phone: defaults?.recipient_phone || '', zone_id: zones[0]?.id || '',
    city: '', neighborhood: '', street: '', building_details: '', national_address_short_code: '', delivery_instructions: '', latitude: '', longitude: '', is_default: false,
    ...Object.fromEntries(Object.entries(initial || {}).map(([k, x]) => [k, typeof x === 'boolean' ? x : x == null ? '' : String(x)])),
  }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function save() {
    setBusy(true); setErr(null);
    const r = await saveAddress(v);
    setBusy(false);
    if (r.error || !r.id) return setErr(r.error || t.error);
    onSaved({ ...v, id: r.id, recipient_phone: String(v.recipient_phone) });
  }
  function locate() {
    navigator.geolocation?.getCurrentPosition((p) => setV((x) => ({ ...x, latitude: p.coords.latitude.toFixed(6), longitude: p.coords.longitude.toFixed(6) })));
  }
  const f = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label><span className="label">{label}</span><input name={k} className="input" value={String(v[k] ?? '')} onChange={set(k)} {...props} /></label>
  );
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-sand-300 p-4" data-testid="address-form">
      <div className="grid gap-3 sm:grid-cols-2">
        {f('recipient_name', t.recipient, { required: true })}
        {f('recipient_phone', t.phone, { required: true, dir: 'ltr', placeholder: '05xxxxxxxx', inputMode: 'tel' })}
        <label><span className="label">{t.zone}</span>
          <select name="zone_id" className="input" value={String(v.zone_id)} onChange={set('zone_id')}>
            {zones.map((z) => <option key={z.id} value={z.id}>{locale === 'ar' ? z.city_ar : z.city_en}</option>)}
          </select>
        </label>
        {f('city', t.city, { required: true })}
        {f('neighborhood', t.neighborhood, { required: true })}
        {f('street', t.street)}
        {f('building_details', t.building)}
        {f('national_address_short_code', t.short_address, { dir: 'ltr', placeholder: 'ABCD1234' })}
        {f('label', t.label)}
        <div className="flex items-end gap-2">
          <button type="button" onClick={locate} className="btn-outline w-full text-xs">{locale === 'ar' ? 'استخدام موقعي الحالي' : 'Use my location'}{v.latitude ? ' ✓' : ''}</button>
        </div>
      </div>
      <label className="block"><span className="label">{t.instructions}</span><textarea name="delivery_instructions" className="input min-h-16" maxLength={500} value={String(v.delivery_instructions)} onChange={set('delivery_instructions')} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!v.is_default} onChange={(e) => setV({ ...v, is_default: e.target.checked })} />{t.set_default}</label>
      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="btn-primary" data-testid="save-address">{t.save}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">{t.cancel}</button>}
      </div>
    </div>
  );
}
