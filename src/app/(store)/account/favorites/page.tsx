import { createClient } from '@/lib/supabase/server';
import { getProducts } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { ProductCard } from '@/components/ProductCard';
export const dynamic = 'force-dynamic';
export default async function Favorites() {
  const { locale, t } = await getT();
  const sb = await createClient();
  const { data } = await sb.from('favorites').select('product_id');
  const ids = (data || []).map((f) => f.product_id);
  const list = ids.length ? await getProducts({ ids }) : [];
  if (!list.length) return <div className="card text-ink/60">{t.no_favorites}</div>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <ProductCard key={p.id} p={p} locale={locale} t={t} />)}</div>;
}
