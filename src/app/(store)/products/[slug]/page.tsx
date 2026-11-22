import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getProducts, getSettings, getUser, PRODUCT_SELECT, sortMedia } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { fill } from '@/lib/i18n/dict';
import { money, dateFmt, waLink, type Locale } from '@/lib/format';
import { stockStatus, type Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Gallery } from '@/components/Gallery';
import { BuyBox } from '@/components/BuyBox';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ReviewForm } from '@/components/ReviewForm';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { Star } from '@/components/icons';

export const dynamic = 'force-dynamic';

async function load(slug: string) {
  const sb = await createClient();
  const { data } = await sb.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle();
  return data ? sortMedia([data as Product])[0] : null;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const { locale } = await getT(); const p = await load(slug);
  return p ? { title: locale === 'ar' ? p.name_ar : p.name_en, description: (locale === 'ar' ? p.description_ar : p.description_en) || undefined } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t } = await getT();
  const p = await load(slug);
  if (!p) notFound();
  const sb = await createClient();
  const [s, user, related, { data: reviews }, { data: animals }] = await Promise.all([
    getSettings(), getUser(), getProducts({ category: p.categories?.slug }),
    sb.from('reviews').select('id,rating,body,reviewer_display_name,created_at').eq('product_id', p.id).eq('is_approved', true).order('created_at', { ascending: false }).limit(20),
    sb.from('animals').select('id,tag_code,specifications').eq('product_id', p.id).eq('status', 'available').order('tag_code').limit(100),
  ]);
  let fav = false;
  if (user) { const { data } = await sb.from('favorites').select('product_id').eq('product_id', p.id).maybeSingle(); fav = !!data; }
  const name = locale === 'ar' ? p.name_ar : p.name_en;
  const desc = locale === 'ar' ? p.description_ar : p.description_en;
  const st = stockStatus(p);
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const selectable = s.individual_animal_selection_enabled && p.inventory_mode === 'individual';
  const inquiry = locale === 'ar' ? `السلام عليكم، أرغب بالاستفسار عن: ${p.name_ar} — السعر ${p.price} ر.س` : `Hello, I'd like to ask about: ${p.name_en} — price SAR ${p.price}`;

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="min-w-0"><Gallery media={p.product_images || []} name={name} demoLabel={t.demo_image} videoLabel={t.video} /></div>
        <div className="min-w-0">
          <p className="text-sm text-brand">{locale === 'ar' ? p.categories?.name_ar : p.categories?.name_en}</p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold md:text-3xl" data-testid="product-name">{name}</h1>
            <FavoriteButton productId={p.id} initial={fav} loggedIn={!!user} />
          </div>
          {reviews && reviews.length > 0 && <div className="mt-2 flex items-center gap-1 text-sm text-ink/70"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{avg.toFixed(1)} · {reviews.length}</div>}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold" data-testid="product-price">{money(p.price, locale)}</span>
            {p.compare_at_price && <span className="text-lg text-ink/45 line-through">{money(p.compare_at_price, locale)}</span>}
            <span className="text-sm text-ink/60">{t.per_head}</span>
          </div>
          <div className="mt-3 text-sm">
            {st === 'sold_out' ? <span className="badge bg-red-50 text-red-700">{t.sold_out}</span>
              : <span className={`badge ${st === 'low_stock' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>{st === 'low_stock' ? t.low_stock : t.available} · {fill(t.in_stock, { n: p.stock_quantity })}</span>}
          </div>
          <div className="mt-6">
            <BuyBox productId={p.id} max={Math.min(p.stock_quantity, 100)} soldOut={st === 'sold_out'} animals={selectable ? (animals || []) : []} />
          </div>
          <a href={waLink(s.whatsapp_number, inquiry)} target="_blank" rel="noopener noreferrer" data-testid="product-whatsapp" className="btn-outline mt-3 w-full py-3"><WhatsAppIcon className="h-5 w-5 text-[#25D366]" />{t.ask_whatsapp}</a>
          <div className="mt-8 border-t border-sand-200 pt-6">
            <h2 className="font-semibold">{t.description}</h2>
            <p className="mt-2 whitespace-pre-line leading-8 text-ink/75">{desc}</p>
            <p className="mt-3 text-xs text-ink/50">{t.delivery_only}</p>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="section-title">{t.reviews}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(reviews || []).map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-sand-300'}`} />)}</div>
              {r.body && <p className="mt-2 text-sm leading-7 text-ink/80">{r.body}</p>}
              <div className="mt-2 text-xs text-ink/50">{r.reviewer_display_name || '—'} · {dateFmt(r.created_at, locale as Locale)}</div>
            </div>
          ))}
          {(!reviews || reviews.length === 0) && <p className="text-sm text-ink/60">{t.no_reviews}</p>}
        </div>
        {user && <ReviewForm productId={p.id} />}
      </section>

      {related.filter((r) => r.id !== p.id).length > 0 && (
        <section className="mt-14">
          <h2 className="section-title mb-5">{t.related}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.filter((r) => r.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} locale={locale} t={t} />)}
          </div>
        </section>
      )}
    </div>
  );
}
