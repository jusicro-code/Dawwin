import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { money } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { stockStatus } from '@/lib/types';
import { CrudTable } from '@/components/admin/CrudTable';
import { CategoryImages } from '@/components/admin/CategoryImages';

export default async function AdminProducts() {
  const { locale, L: tr } = await L();
  const sb = await createClient();
  const [{ data: products }, { data: cats }] = await Promise.all([
    sb.from('products').select('*, product_images(*), categories(name_ar,name_en)').order('is_archived').order('sort_order'),
    sb.from('categories').select('*').order('sort_order'),
  ]);
  const label = { available: tr('متوفر', 'Available'), low_stock: tr('كمية منخفضة', 'Low stock'), sold_out: tr('نفد', 'Sold out'), hidden: tr('مخفي', 'Hidden') };
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{tr('المنتجات والمخزون', 'Products & stock')}</h1><Link href="/admin/products/new" className="btn-primary" data-testid="new-product">+ {tr('منتج جديد', 'New product')}</Link></div>
      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="table" data-testid="admin-products-table">
          <thead><tr><th /><th>{tr('المنتج', 'Product')}</th><th>{tr('القسم', 'Category')}</th><th>{tr('السعر', 'Price')}</th><th>{tr('المخزون', 'Stock')}</th><th>{tr('نوع المخزون', 'Inventory')}</th><th>{tr('الحالة', 'Status')}</th></tr></thead>
          <tbody>{(products || []).map((p) => {
            const img = p.product_images?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0];
            const st = p.is_archived ? 'archived' : stockStatus(p);
            return (
              <tr key={p.id} className={p.is_archived ? 'opacity-50' : ''}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <td>{img && <img src={mediaUrl(img)} alt="" className="h-10 w-12 rounded-lg object-cover" />}</td>
                <td><Link href={`/admin/products/${p.id}`} className="font-semibold text-brand hover:underline">{locale === 'ar' ? p.name_ar : p.name_en}</Link><div className="text-xs text-ink/50" dir="ltr">{p.slug}</div></td>
                <td>{locale === 'ar' ? p.categories?.name_ar : p.categories?.name_en}</td>
                <td>{money(p.price, locale)}{p.compare_at_price && <div className="text-xs text-ink/50 line-through">{money(p.compare_at_price, locale)}</div>}</td>
                <td className="font-semibold">{p.stock_quantity}</td>
                <td>{p.inventory_mode === 'individual' ? tr('رؤوس مرقمة', 'Individual IDs') : tr('كمية', 'Quantity')}</td>
                <td><span className="badge bg-sand-100">{st === 'archived' ? tr('مؤرشف', 'Archived') : label[st]}</span></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <CrudTable table="categories" rows={cats || []} title={{ ar: 'الأقسام', en: 'Categories' }} canDelete={false} fields={[
        { key: 'slug', ar: 'المعرف (لاتيني)', en: 'Slug', required: true, dir: 'ltr' },
        { key: 'name_ar', ar: 'الاسم بالعربية', en: 'Arabic name', required: true }, { key: 'name_en', ar: 'الاسم بالإنجليزية', en: 'English name', required: true },
        { key: 'description_ar', ar: 'الوصف عربي', en: 'Description AR', list: false }, { key: 'description_en', ar: 'الوصف إنجليزي', en: 'Description EN', list: false },
        { key: 'sort_order', ar: 'الترتيب', en: 'Order', type: 'number' }, { key: 'is_active', ar: 'مفعل', en: 'Active', type: 'bool' },
      ]} defaults={{ is_active: true, sort_order: 10 }} />
      <CategoryImages categories={(cats || []).map((c) => ({ id: c.id, name: locale === 'ar' ? c.name_ar : c.name_en, image_path: c.image_path, image_credit: c.image_credit }))} />
    </div>
  );
}
