'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { errorText } from '@/lib/errors';
import { Star } from './icons';
export function ReviewForm({ productId }: { productId: string }) {
  const { t, locale } = useT();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await createClient().rpc('submit_review', { p_product: productId, p_rating: rating, p_body: body, p_display_name: name });
    setMsg(error ? errorText(error, locale) : t.review_pending); setBusy(false);
    if (!error) setBody('');
  }
  return (
    <form onSubmit={submit} className="card mt-6 max-w-xl space-y-3">
      <div className="font-semibold">{t.write_review}</div>
      <div className="flex gap-1" role="radiogroup" aria-label={t.rating}>
        {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n}`}><Star className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-sand-300'}`} /></button>)}
      </div>
      <input className="input" placeholder={t.full_name} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      <textarea className="input min-h-24" value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} />
      <button className="btn-primary" disabled={busy}>{t.submit}</button>
      {msg && <p className="text-sm text-ink/70">{msg}</p>}
    </form>
  );
}
