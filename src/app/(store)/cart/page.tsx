import { getT } from '@/lib/i18n/server';
import { CartView } from '@/components/CartView';
export async function generateMetadata() { const { t } = await getT(); return { title: t.cart_title }; }
export default function CartPage() { return <CartView />; }
