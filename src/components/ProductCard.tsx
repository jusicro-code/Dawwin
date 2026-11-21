import Link from 'next/link';
import { money, type Locale } from '@/lib/format';
import { stockStatus, type Product } from '@/lib/types';
import type { Dict } from '@/lib/i18n/dict';
import { ProductImage } from './ProductImage';
import { AddToCartButton } from './AddToCartButton';

export function ProductCard({ p, locale, t }: { p: Product; locale: Locale; t: Dict }) {
  const name = locale === 'ar' ? p.name_ar : p.name_en;
  const st = stockStatus(p);
  const img = p.product_images?.find((m) => m.media_type === 'image');
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card transition hover:-translate-y-0.5">
      <Link href={`/products/${p.slug}`} className="block">
        <ProductImage media={img} alt={name} demoLabel={t.demo_image} className="aspect-[4/3]" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${p.slug}`} className="text-base font-semibold text-ink hover:text-brand">{name}</Link>
          {st === 'sold_out' ? <span className="badge bg-red-50 text-red-700">{t.sold_out}</span>
            : st === 'low_stock' ? <span className="badge bg-amber-50 text-amber-800">{t.low_stock}</span>
            : <span className="badge bg-emerald-50 text-emerald-800">{t.available}</span>}
        </div>
        <p className="text-xs text-ink/60">{locale === 'ar' ? p.categories?.name_ar : p.categories?.name_en} · {t.per_head}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <div className="text-lg font-bold text-ink">{money(p.price, locale)}</div>
            {p.compare_at_price && <div className="text-xs text-ink/50 line-through">{money(p.compare_at_price, locale)}</div>}
          </div>
          <AddToCartButton productId={p.id} disabled={st === 'sold_out'} compact />
        </div>
      </div>
    </article>
  );
}
