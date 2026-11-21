'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { Heart } from './icons';
export function FavoriteButton({ productId, initial, loggedIn }: { productId: string; initial: boolean; loggedIn: boolean }) {
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);
  const { t } = useT();
  const router = useRouter();
  async function toggle() {
    if (!loggedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
    setBusy(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBusy(false); return; }
    const { error } = fav
      ? await sb.from('favorites').delete().eq('product_id', productId).eq('user_id', user.id)
      : await sb.from('favorites').insert({ product_id: productId, user_id: user.id });
    if (!error) setFav(!fav);
    setBusy(false);
  }
  return (
    <button type="button" onClick={toggle} disabled={busy} data-testid="favorite-btn" aria-pressed={fav} aria-label={fav ? t.remove_favorite : t.add_favorite}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sand-300 bg-white hover:border-brand">
      <Heart className={`h-5 w-5 ${fav ? 'fill-red-500 text-red-500' : 'text-ink/60'}`} />
    </button>
  );
}
