'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { useCartProducts, useQuote } from './useCartData';
import { useT } from '@/lib/i18n/client';
import { money } from '@/lib/format';
import { codeText } from '@/lib/errors';
import { ProductImage } from './ProductImage';
import { Minus, Plus, Trash2 } from './icons';
import { Breakdown } from './Breakdown';

export function CartView() {
  const { t, locale } = useT();
  const cart = useCart();
  const products = useCartProducts(cart.lines);
  const { quote } = useQuote(cart.lines, null, null);
  if (!cart.ready) return <div className="mx-auto max-w-page px-4 py-16 text-center text-ink/60">{t.loading}</div>;
  if (cart.lines.length === 0) return (
    <div className="mx-auto max-w-page px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t.cart_empty}</h1>
      <Link href="/products" className="btn-primary mt-6">{t.continue_shopping}</Link>
    </div>
  );
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-2xl font-bold md:text-3xl">{t.cart_title}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4" data-testid="cart-lines">
          {cart.lines.map((l) => {
            const p = products[l.productId];
            const name = p ? (locale === 'ar' ? p.name_ar : p.name_en) : '…';
            const err = quote?.errors.find((e) => e.product_id === l.productId);
            return (
              <li key={l.key} className="card flex gap-4 p-4">
                <ProductImage media={p?.product_images?.find((m) => m.media_type === 'image')} alt={name} demoLabel={t.demo_image} className="h-24 w-28 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={p ? `/products/${p.slug}` : '#'} className="font-semibold hover:text-brand">{name}</Link>
                    <button onClick={() => cart.remove(l.key)} aria-label={t.remove} className="text-ink/50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {p && <div className="text-sm text-ink/60">{money(p.price, locale)} · {t.per_head}</div>}
                  {l.animalIds.length > 0 && <div className="text-xs text-ink/60">{t.animal_tag}: {l.animalIds.length}</div>}
                  <div className="mt-auto flex items-center justify-between">
                    {l.animalIds.length === 0 ? (
                      <div className="inline-flex items-center rounded-xl border border-sand-300">
                        <button aria-label="-" onClick={() => cart.setQty(l.key, l.quantity - 1)} className="p-2"><Minus className="h-4 w-4" /></button>
                        <span className="w-10 text-center font-semibold" data-testid="line-qty">{l.quantity}</span>
                        <button aria-label="+" onClick={() => cart.setQty(l.key, l.quantity + 1)} className="p-2"><Plus className="h-4 w-4" /></button>
                      </div>
                    ) : <span className="text-sm">{t.quantity}: {l.quantity}</span>}
                    {p && <span className="font-bold">{money(p.price * l.quantity, locale)}</span>}
                  </div>
                  {err && <p className="text-xs text-red-600">{codeText(err.code, locale)}{err.available !== undefined ? ` (${err.available})` : ''}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        <aside className="card h-fit space-y-4">
          <div className="font-semibold">{t.cost_breakdown}</div>
          {quote && <Breakdown q={quote} showDeliveryPending />}
          <Link href="/checkout" data-testid="go-checkout" className={`btn-primary w-full py-3 ${quote?.errors.length ? 'pointer-events-none opacity-50' : ''}`}>{t.checkout}</Link>
          <Link href="/products" className="btn-ghost w-full">{t.continue_shopping}</Link>
        </aside>
      </div>
    </div>
  );
}
