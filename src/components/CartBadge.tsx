'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { useT } from '@/lib/i18n/client';
import { ShoppingBag } from './icons';
export function CartBadge() {
  const { count } = useCart();
  const { t } = useT();
  return (
    <Link href="/cart" aria-label={t.nav_cart} data-testid="cart-link" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand-100">
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && <span data-testid="cart-count" className="absolute -end-0.5 -top-0.5 min-w-5 rounded-full bg-brand px-1.5 text-center text-[11px] font-bold leading-5 text-white">{count}</span>}
    </Link>
  );
}
