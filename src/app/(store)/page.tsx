import Link from 'next/link';
import { getBestSellerIds, getCategories, getProducts, getSettings } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { fill } from '@/lib/i18n/dict';
import { money, waLink } from '@/lib/format';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { Receipt, ShieldCheck, Truck, Search, Instagram } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { locale, t } = await getT();
  const sb = await createClient();
  const [s, cats, all, bestIds, { data: rules }, { data: promos }] = await Promise.all([
    getSettings(), getCategories(), getProducts(), getBestSellerIds(4),
    sb.from('bulk_discount_rules').select('*').order('min_quantity'),
    sb.from('promotions').select('*').order('sort_order'),
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
      <section className="relative overflow-hidden border-b border-sand-200 bg-[radial-gradient(ellipse_at_top,_var(--brand-soft),_transparent_60%)]">
        <div className="mx-auto grid max-w-page items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-semibold text-brand">{t.hero_kicker}</p>
            <h1 className="mt-3 text-3xl font-bold leading-[1.3] text-ink md:text-[44px] md:leading-[1.25]">{t.hero_title}</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-ink/70">{t.hero_sub}</p>
            <form action="/products" className="mt-6 flex max-w-lg gap-2">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input name="q" placeholder={t.search_placeholder} aria-label={t.search} className="input h-12 ps-10" />
              </label>
              <button className="btn-primary h-12 px-5">{t.search}</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary h-12 px-6">{t.hero_cta}</Link>
              <a href={waLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn-outline h-12 px-5" data-testid="home-whatsapp"><WhatsAppIcon className="h-5 w-5 text-[#25D366]" />{t.hero_cta2}</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {cats.map((c, i) => (
              <Link key={c.id} href={`/products?category=${c.slug}`} className={`group relative overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-card ${i === 0 ? 'row-span-2' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/placeholders/${c.slug === 'goats' ? 'goat' : 'sheep'}.svg`} alt="" className="h-full min-h-40 w-full object-cover transition group-hover:scale-[1.02]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 text-white">
                  <div className="text-lg font-bold">{L(c.name_ar, c.name_en)}</div>
                  <div className="text-xs opacity-80">{L(c.description_ar, c.description_en)}</div>
                </div>
                <span className="absolute start-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] text-white">{t.demo_image}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[{ i: Truck, a: t.delivery_only }, { i: ShieldCheck, a: t.awaiting_payment_note }, { i: Receipt, a: locale === 'ar' ? 'فاتورة مفصّلة لكل طلب مع تفصيل الرسوم والضريبة.' : 'Detailed invoice for every order with fees and tax breakdown.' }].map(({ i: I, a }, k) => (
            <div key={k} className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-white p-4 text-sm leading-6 text-ink/75"><I className="mt-0.5 h-5 w-5 shrink-0 text-brand" />{a}</div>
          ))}
        </div>
      </section>

      {promos && promos.length > 0 && (
        <section className="mx-auto max-w-page px-4 pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            {promos.map((pr) => (
              <Link key={pr.id} href={pr.link_url || '/products'} className="rounded-3xl bg-brand p-6 text-white shadow-card">
                <div className="text-xl font-bold">{L(pr.title_ar, pr.title_en)}</div>
                {L(pr.body_ar, pr.body_en) && <p className="mt-2 text-sm opacity-90">{L(pr.body_ar, pr.body_en)}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-page px-4 py-8">
        <h2 className="section-title mb-5">{t.categories}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="btn-outline rounded-full">{t.all_products}</Link>
          {cats.map((c) => <Link key={c.id} href={`/products?category=${c.slug}`} className="btn-outline rounded-full">{L(c.name_ar, c.name_en)}</Link>)}
        </div>
      </section>

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
                <div className="text-2xl font-bold text-brand">{r.discount_type === 'percentage' ? `${Number(r.discount_value)}%` : money(r.discount_value, locale)} <span className="text-sm font-medium text-ink/60">{t.off}{r.discount_type === 'fixed' ? ` ${t.per_head}` : ''}</span></div>
                <div className="mt-1 font-semibold">{L(r.name_ar, r.name_en)}</div>
                <div className="text-sm text-ink/60">{fill(t.qty_rule, { n: r.min_quantity })}</div>
              </div>
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
