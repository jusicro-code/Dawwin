import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { dateFmt, normalizeSaPhone } from '@/lib/format';
import { statusColor, statusLabel } from '@/lib/status';
import { errorText } from '@/lib/errors';
export const dynamic = 'force-dynamic';
type Tracked = { order_number: string; status: string; payment_status: string; delivery_date: string; delivery_window: string; history: { status: string; at: string }[] };
export default async function Track({ searchParams }: { searchParams: Promise<{ number?: string; phone?: string }> }) {
  const sp = await searchParams;
  const { locale, t } = await getT();
  let result: Tracked | null = null; let err: string | null = null;
  if (sp.number && sp.phone) {
    const phone = normalizeSaPhone(sp.phone);
    if (!phone) err = errorText('INVALID_PHONE', locale);
    else {
      const sb = await createClient();
      const { data, error } = await sb.rpc('track_order', { p_number: sp.number, p_phone: phone });
      if (error) err = errorText(error, locale); else if (!data) err = t.not_found; else result = data as Tracked;
    }
  }
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">{t.track_title}</h1>
      <p className="mt-1 text-sm text-ink/60">{t.track_hint}</p>
      <form className="card mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input name="number" required defaultValue={sp.number} placeholder={t.order_number} dir="ltr" className="input" aria-label={t.order_number} />
        <input name="phone" required defaultValue={sp.phone} placeholder="05xxxxxxxx" dir="ltr" className="input" aria-label={t.phone} />
        <button className="btn-primary">{t.track_btn}</button>
      </form>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      {result && (
        <div className="card mt-6 space-y-3 text-sm" data-testid="track-result">
          <div className="flex justify-between"><b dir="ltr">{result.order_number}</b><span className={`badge ${statusColor(result.status)}`}>{statusLabel(result.status, locale)}</span></div>
          <div>{t.schedule_section}: {dateFmt(result.delivery_date, locale)} · <span dir="ltr">{result.delivery_window}</span></div>
          <ul className="space-y-1 border-t border-sand-200 pt-3">{(result.history || []).map((h, i) => <li key={i} className="flex justify-between"><span>{statusLabel(h.status, locale)}</span><span className="text-ink/50">{dateFmt(h.at, locale, true)}</span></li>)}</ul>
        </div>
      )}
    </div>
  );
}
