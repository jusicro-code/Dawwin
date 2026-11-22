import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { ProductCard } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; offers?: string; sort?: string }> }) {
  const sp = await searchParams;
  const { locale, t } = await getT();
  const [cats, list] = await Promise.all([getCategories(), getProducts({ category: sp.category, q: sp.q, offers: sp.offers === '1' })]);
  if (sp.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  if (sp.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  const active = cats.find((c) => c.slug === sp.category);
  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(); Object.entries({ ...sp, ...o }).forEach(([k, v]) => v && p.set(k, v)); return `/products?${p}`;
  };
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-2xl font-bold md:text-3xl">
        {sp.q ? <>{t.results_for} “{sp.q}”</> : active ? (locale === 'ar' ? active.name_ar : active.name_en) : sp.offers ? t.offers : t.all_products}
      </h1>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href={qs({ category: undefined })} className={`badge px-3.5 py-1.5 text-sm ${!sp.category ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-sand-200'}`}>{t.all_products}</Link>
        {cats.map((c) => (
          <Link key={c.id} href={qs({ category: c.slug })} className={`badge px-3.5 py-1.5 text-sm ${sp.category === c.slug ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-sand-200'}`}>{locale === 'ar' ? c.name_ar : c.name_en}</Link>
        ))}
        <form className="ms-auto" action="/products">
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          <select name="sort" defaultValue={sp.sort || ''} className="input h-9 py-1 text-sm" aria-label="sort">
            <option value="">{locale === 'ar' ? 'الترتيب الافتراضي' : 'Default order'}</option>
            <option value="price_asc">{locale === 'ar' ? 'السعر: من الأقل' : 'Price: low to high'}</option>
            <option value="price_desc">{locale === 'ar' ? 'السعر: من الأعلى' : 'Price: high to low'}</option>
          </select>
          <button className="btn-ghost ms-1 py-1.5">{t.apply}</button>
        </form>
      </div>
      {list.length === 0 ? <p className="mt-16 text-center text-ink/60">{t.no_results}</p> : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="product-grid">
          {list.map((p) => <ProductCard key={p.id} p={p} locale={locale} t={t} />)}
        </div>
      )}
    </div>
  );
}
