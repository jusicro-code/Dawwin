import { createClient } from '@/lib/supabase/server';
import { CrudTable } from '@/components/admin/CrudTable';
export default async function Reviews() {
  const sb = await createClient();
  const { data } = await sb.from('reviews').select('id,rating,body,reviewer_display_name,is_approved,created_at,products(name_ar)').order('created_at', { ascending: false }).limit(300);
  const rows = (data || []).map((r) => ({ ...r, product: (Array.isArray(r.products) ? r.products[0] : r.products)?.name_ar }));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التقييمات · Reviews</h1>
      <p className="text-sm text-ink/60">لا يمكن التقييم إلا لمن استلم طلباً يحتوي المنتج (مشترٍ موثّق). لا يظهر التقييم للعامة إلا بعد الموافقة. · Only customers with a delivered order containing the product can review; reviews appear publicly only after approval.</p>
      <CrudTable table="reviews" rows={rows} canCreate={false} fields={[
        { key: 'product', ar: 'المنتج', en: 'Product', readOnly: true }, { key: 'rating', ar: 'التقييم', en: 'Rating', type: 'number', readOnly: true }, { key: 'created_at', ar: 'التاريخ', en: 'Date', type: 'datetime', readOnly: true },
        { key: 'reviewer_display_name', ar: 'الاسم', en: 'Name' }, { key: 'body', ar: 'النص', en: 'Text', type: 'textarea' },
        { key: 'is_approved', ar: 'معتمد للنشر', en: 'Approved', type: 'bool' },
      ]} />
    </div>
  );
}
