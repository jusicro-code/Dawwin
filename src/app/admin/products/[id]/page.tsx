import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { dateFmt } from '@/lib/format';

export default async function AdminProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const { data: cats } = await sb.from('categories').select('id,name_ar,name_en').order('sort_order');
  if (id === 'new') return <div className="space-y-4"><Link href="/admin/products" className="text-sm text-brand">← {tr('المنتجات', 'Products')}</Link><ProductEditor product={null} categories={cats || []} media={[]} animals={[]} cost={null} /></div>;
  const { data: p } = await sb.from('products').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  const [{ data: media }, { data: animals }, { data: cost }, { data: moves }] = await Promise.all([
    sb.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    sb.from('animals').select('*').eq('product_id', id).order('created_at', { ascending: false }),
    sb.from('product_costs').select('cost_price').eq('product_id', id).maybeSingle(),
    sb.from('inventory_movements').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(30),
  ]);
  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-sm text-brand">← {tr('المنتجات', 'Products')}</Link>
      <ProductEditor product={p} categories={cats || []} media={media || []} animals={animals || []} cost={cost?.cost_price ?? null} />
      <section className="card text-sm">
        <h2 className="mb-3 font-semibold">{tr('حركات المخزون', 'Inventory movements')}</h2>
        <table className="table"><tbody>{(moves || []).map((m) => (
          <tr key={m.id}><td className={m.delta > 0 ? 'text-emerald-700' : 'text-red-700'}>{m.delta > 0 ? '+' : ''}{m.delta}</td><td>{m.reason}</td><td className="text-ink/60">{m.note}</td><td className="text-ink/50">{dateFmt(m.created_at, locale, true)}</td></tr>
        ))}</tbody></table>
      </section>
    </div>
  );
}
