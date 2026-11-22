import Link from 'next/link';
import { getBestSellerIds, getCategories, getProducts, getSettings } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { fill } from '@/lib/i18n/dict';
import { money, waLink } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { Receipt, ShieldCheck, Truck, Search, Instagram } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { locale, t } = await getT();
  const sb = await createClient();
  const [s, cats, all, bestIds, { data: rules }, { data: promos }, { data: reviews }] = await Promise.all([
    getSettings(), getCategories(), getProducts(), getBestSellerIds(4),
    sb.from('bulk_discount_rules').select('*').order('min_quantity'),
    sb.from('promotions').select('*').order('sort_order'),
    sb.rpc('latest_reviews', { p_limit: 6 }),
  ]);
  const featured = all.filter((p) => p.is_featured);
  const newArrivals = all.filter((p) => p.is_new_arrival);
  const offers = all.filter((p) => p.compare_at_price);
  const best = bestIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as typeof all;
  const L = (ar?: string | null, en?: string | null) => (locale === 'ar' ? ar : en) || '';
  const grid = (list: typeof all) => (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} locale={locale} t={t} />)}</div>
  );
  const sectionHead = (title: string, href: string) => (
    <div className="mb-5 flex items-end justify-between"><h2 className="section-title">{title}</h2><Link href={href} className="text-sm font-medium text-brand hover:underline">{t.view_all}</Link></div>
  );

  return (
    <>
      <section className="relative overflow-hidden bg-brand text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #D5A84A 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-brand-2 blur-3xl" />
        <div className="relative mx-auto grid max-w-page items-center gap-10 px-4 py-14 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-3 py-1 text-xs font-semibold text-gold">{t.hero_kicker}</p>
            <h1 className="mt-4 text-3xl font-bold leading-[1.3] md:text-[46px] md:leading-[1.25]">{t.hero_title}</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/75">{t.hero_sub}</p>
            <form action="/products" className="mt-7 flex max-w-lg gap-2">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input name="q" placeholder={t.search_placeholder} aria-label={t.search} className="input h-12 border-transparent ps-10" />
              </label>
              <button className="btn-gold h-12 px-5">{t.search}</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/products" className="btn-gold h-12 px-7">{t.hero_cta}</Link>
              <a href={waLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn h-12 border border-white/25 px-5 text-white hover:bg-white/10" data-testid="home-whatsapp"><WhatsAppIcon className="h-5 w-5 text-[#25D366]" />{t.hero_cta2}</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-6 rounded-[2.5rem] bg-gold/30 blur-2xl" />
            <div className="relative rounded-[2.5rem] border border-gold/40 bg-sand-50 p-6 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.logo_url || '/brand/logo.png'} alt={locale === 'ar' ? s.store_name_ar : s.store_name_en} className="mx-auto aspect-square w-full object-contain" />
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold text-brand">{s.store_name_ar}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">{s.store_name_en}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-px max-w-page px-4 pt-10">
        <h2 className="section-title mb-5">{t.categories}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {cats.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className="group relative block aspect-[16/7] overflow-hidden rounded-3xl border border-sand-200 shadow-card">
              {c.image_path
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={mediaUrl({ storage_path: c.image_path, external_url: null })} alt={L(c.name_ar, c.name_en)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                : <div className="h-full w-full bg-gradient-to-br from-brand-2 to-brand"><div className="h-full w-full opacity-[0.09]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #D5A84A 1px, transparent 0)', backgroundSize: '16px 16px' }} /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                <div><div className="text-2xl font-bold">{L(c.name_ar, c.name_en)}</div><div className="text-sm text-white/80">{L(c.description_ar, c.description_en)}</div></div>
                <span className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-brand-dark">{t.view_all}</span>
              </div>
              {c.image_credit && <span className="absolute end-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80">{c.image_credit}</span>}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[{ i: Truck, a: t.delivery_only }, { i: ShieldCheck, a: t.awaiting_payment_note }, { i: Receipt, a: locale === 'ar' ? 'فاتورة مفصّلة لكل طلب مع تفصيل الرسوم والضريبة.' : 'Detailed invoice for every order with fees and tax breakdown.' }].map(({ i: I, a }, k) => (
            <div key={k} className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-white p-4 text-sm leading-6 text-ink/75"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft"><I className="h-5 w-5 text-brand" /></span>{a}</div>
          ))}
        </div>
      </section>

      {promos && promos.length > 0 && (
        <section className="mx-auto max-w-page px-4 pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            {promos.map((pr) => (
              <Link key={pr.id} href={pr.link_url || '/products'} className="rounded-3xl border border-gold/40 bg-brand p-6 text-white shadow-card">
                <div className="text-xl font-bold">{L(pr.title_ar, pr.title_en)}</div>
                {L(pr.body_ar, pr.body_en) && <p className="mt-2 text-sm opacity-90">{L(pr.body_ar, pr.body_en)}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}


      {featured.length > 0 && <section className="mx-auto max-w-page px-4 py-8">{sectionHead(t.featured, '/products')}{grid(featured)}</section>}
      {best.length > 0 && <section className="mx-auto max-w-page px-4 py-8">{sectionHead(t.best_sellers, '/products')}{grid(best)}</section>}
      {newArrivals.length > 0 && <section className="mx-auto max-w-page px-4 py-8">{sectionHead(t.new_arrivals, '/products')}{grid(newArrivals)}</section>}
      {offers.length > 0 && <section className="mx-auto max-w-page px-4 py-8">{sectionHead(t.offers, '/products?offers=1')}{grid(offers)}</section>}

      {rules && rules.length > 0 && (
        <section className="mx-auto max-w-page px-4 py-8">
          <h2 className="section-title mb-5">{t.quantity_discounts}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rules.map((r) => (
              <div key={r.id} className="card">
                <div className="text-2xl font-bold text-gold-dark">{r.discount_type === 'percentage' ? `${Number(r.discount_value)}%` : money(r.discount_value, locale)} <span className="text-sm font-medium text-ink/60">{t.off}{r.discount_type === 'fixed' ? ` ${t.per_head}` : ''}</span></div>
                <div className="mt-1 font-semibold">{L(r.name_ar, r.name_en)}</div>
                <div className="text-sm text-ink/60">{fill(t.qty_rule, { n: r.min_quantity })}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {reviews && reviews.length > 0 && (
        <section className="mx-auto max-w-page px-4 py-8">
          <h2 className="section-title mb-5">{t.verified_reviews}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((r: { id: string; rating: number; body: string | null; reviewer_display_name: string | null; product_name_ar: string; product_name_en: string; product_slug: string }) => (
              <figure key={r.id} className="card">
                <div className="text-gold" aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}<span className="text-sand-300">{'★'.repeat(5 - r.rating)}</span></div>
                {r.body && <blockquote className="mt-2 text-sm leading-7 text-ink/80">{r.body}</blockquote>}
                <figcaption className="mt-3 text-xs text-ink/50">{r.reviewer_display_name || '—'} · <Link href={`/products/${r.product_slug}`} className="text-brand">{L(r.product_name_ar, r.product_name_en)}</Link></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-page px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-sand-200 bg-white p-6 shadow-card md:flex-row md:items-center">
          <div>
            <div className="text-lg font-bold">{t.nav_contact}</div>
            <div className="text-sm text-ink/60" dir="ltr">{s.whatsapp_number}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={waLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn-primary bg-[#1f9d55] hover:bg-[#178246]"><WhatsAppIcon />WhatsApp</a>
            {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-outline"><Instagram className="h-4 w-4" />Instagram</a>}
            {s.tiktok_url && <a href={s.tiktok_url} target="_blank" rel="noopener noreferrer" className="btn-outline">TikTok</a>}
          </div>
        </div>
      </section>
    </>
  );
}
