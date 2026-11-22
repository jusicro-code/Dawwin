'use client';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { useT } from '@/lib/i18n/client';
import { Check, ShoppingBag } from './icons';

export function AddToCartButton({ productId, quantity = 1, animalIds, disabled, compact }: { productId: string; quantity?: number; animalIds?: string[]; disabled?: boolean; compact?: boolean }) {
  const { add } = useCart();
  const { t } = useT();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button" disabled={disabled}
      data-testid="add-to-cart"
      onClick={() => { add(productId, quantity, animalIds); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className={`btn-primary ${compact ? 'px-3 py-2 text-sm' : 'w-full py-3'}`}
    >
      {done ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      <span>{disabled ? t.sold_out : done ? t.added : t.add_to_cart}</span>
    </button>
  );
}
