'use client';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { useT } from '@/lib/i18n/client';
export function ReorderButton({ items }: { items: { productId: string; quantity: number }[] }) {
  const { add } = useCart(); const { t } = useT(); const router = useRouter();
  return <button type="button" className="btn-outline text-xs" data-testid="reorder" onClick={() => { items.forEach((i) => add(i.productId, i.quantity)); router.push('/cart'); }}>{t.reorder}</button>;
}
