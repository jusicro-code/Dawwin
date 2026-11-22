'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { errorText } from '@/lib/errors';
import { normalizeSaPhone } from '@/lib/format';
export function SupportForm() {
  const { t, locale } = useT();
  const [v, setV] = useState({ kind: 'inquiry', name: '', phone: '', email: '', order: '', message: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const phone = v.phone ? normalizeSaPhone(v.phone) : null;
    if (v.phone && !phone) return setMsg({ ok: false, text: errorText('INVALID_PHONE', locale) });
    if (!phone && !v.email) return setMsg({ ok: false, text: locale === 'ar' ? 'أدخل الجوال أو البريد للتواصل' : 'Enter a phone or email so we can reply' });
    setBusy(true);
    const { error } = await createClient().rpc('submit_support_request', { p_kind: v.kind, p_name: v.name, p_phone: phone, p_email: v.email, p_order_number: v.order, p_message: v.message });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: errorText(error, locale) });
    setMsg({ ok: true, text: t.support_sent }); setV({ ...v, message: '', order: '' });
  }
  return (
    <form onSubmit={submit} className="card grid gap-3 sm:grid-cols-2" data-testid="support-form">
      <label><span className="label">{t.kind}</span><select className="input" value={v.kind} onChange={set('kind')}>
        {(['inquiry', 'complaint', 'order_issue', 'refund_request'] as const).map((k) => <option key={k} value={k}>{t[`k_${k}`]}</option>)}</select></label>
      <label><span className="label">{t.full_name}</span><input className="input" required minLength={2} maxLength={120} value={v.name} onChange={set('name')} /></label>
      <label><span className="label">{t.phone}</span><input className="input" dir="ltr" placeholder="05xxxxxxxx" value={v.phone} onChange={set('phone')} /></label>
      <label><span className="label">{t.email}</span><input className="input" dir="ltr" type="email" value={v.email} onChange={set('email')} /></label>
      <label className="sm:col-span-2"><span className="label">{t.order_number}</span><input className="input" dir="ltr" maxLength={40} value={v.order} onChange={set('order')} /></label>
      <label className="sm:col-span-2"><span className="label">{t.message}</span><textarea className="input min-h-28" required minLength={5} maxLength={4000} value={v.message} onChange={set('message')} /></label>
      {msg && <p className={`sm:col-span-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`} role="status">{msg.text}</p>}
      <div className="sm:col-span-2"><button className="btn-primary" disabled={busy}>{t.submit}</button></div>
    </form>
  );
}
