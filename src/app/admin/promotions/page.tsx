import { createClient } from '@/lib/supabase/server';
import { CrudTable } from '@/components/admin/CrudTable';
export default async function Promotions() {
  const sb = await createClient();
  const [{ data: coupons }, { data: rules }, { data: promos }, { data: products }, { data: cats }] = await Promise.all([
    sb.from('coupons').select('*').order('created_at', { ascending: false }), sb.from('bulk_discount_rules').select('*').order('min_quantity'),
    sb.from('promotions').select('*').order('sort_order'), sb.from('products').select('id,name_ar,name_en').eq('is_archived', false), sb.from('categories').select('id,name_ar,name_en'),
  ]);
  const dt = [{ value: 'percentage', ar: 'نسبة %', en: 'Percentage %' }, { value: 'fixed', ar: 'مبلغ ثابت', en: 'Fixed amount' }];
  const prodOpts = (products || []).map((p) => ({ value: p.id, ar: p.name_ar, en: p.name_en }));
  const catOpts = (cats || []).map((c) => ({ value: c.id, ar: c.name_ar, en: c.name_en }));
  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">العروض والخصومات · Promotions</h1>
      <CrudTable table="bulk_discount_rules" rows={rules || []} title={{ ar: 'خصومات الكمية', en: 'Quantity (bulk) discounts' }} defaults={{ is_active: true, discount_type: 'percentage' }} fields={[
        { key: 'name_ar', ar: 'الاسم عربي', en: 'Name AR', required: true }, { key: 'name_en', ar: 'الاسم إنجليزي', en: 'Name EN', required: true },
        { key: 'min_quantity', ar: 'الحد الأدنى للرؤوس', en: 'Min. quantity', type: 'number', required: true, help: { ar: '2 أو أكثر', en: '2 or more' } },
        { key: 'discount_type', ar: 'نوع الخصم', en: 'Type', type: 'select', options: dt },
        { key: 'discount_value', ar: 'القيمة', en: 'Value', type: 'number', required: true, help: { ar: 'المبلغ الثابت يُطبق لكل رأس', en: 'Fixed amount applies per animal' } },
        { key: 'product_id', ar: 'منتج محدد', en: 'Specific product', type: 'select', nullable: true, options: prodOpts },
        { key: 'category_id', ar: 'قسم محدد', en: 'Specific category', type: 'select', nullable: true, options: catOpts },
        { key: 'starts_at', ar: 'يبدأ', en: 'Starts', type: 'datetime' }, { key: 'ends_at', ar: 'ينتهي', en: 'Ends', type: 'datetime' },
        { key: 'is_active', ar: 'مفعل', en: 'Active', type: 'bool' },
      ]} />
      <CrudTable table="coupons" rows={coupons || []} title={{ ar: 'كوبونات الخصم', en: 'Coupons' }} defaults={{ is_active: true, discount_type: 'percentage' }} fields={[
        { key: 'code', ar: 'الكود', en: 'Code', required: true, dir: 'ltr' }, { key: 'description', ar: 'وصف داخلي', en: 'Internal description', list: false },
        { key: 'discount_type', ar: 'النوع', en: 'Type', type: 'select', options: dt }, { key: 'discount_value', ar: 'القيمة', en: 'Value', type: 'number', required: true },
        { key: 'max_discount_amount', ar: 'أقصى خصم', en: 'Max discount', type: 'number', list: false },
        { key: 'min_subtotal', ar: 'حد أدنى للمبلغ', en: 'Min. subtotal', type: 'number' }, { key: 'min_quantity', ar: 'حد أدنى للرؤوس', en: 'Min. quantity', type: 'number', list: false },
        { key: 'max_uses', ar: 'أقصى استخدام', en: 'Max uses', type: 'number' }, { key: 'max_uses_per_customer', ar: 'لكل عميل', en: 'Per customer', type: 'number', list: false },
        { key: 'times_used', ar: 'مستخدم', en: 'Used', type: 'number', list: true },
        { key: 'customer_id', ar: 'عميل محدد (المعرف)', en: 'Specific customer (user ID)', list: false, dir: 'ltr' },
        { key: 'wholesale_only', ar: 'لعملاء الجملة فقط', en: 'Wholesale only', type: 'bool', list: false },
        { key: 'combinable_with_bulk', ar: 'يجمع مع خصم الكمية', en: 'Combine with bulk', type: 'bool', list: false },
        { key: 'starts_at', ar: 'يبدأ', en: 'Starts', type: 'datetime' }, { key: 'ends_at', ar: 'ينتهي', en: 'Ends', type: 'datetime' },
        { key: 'is_active', ar: 'مفعل', en: 'Active', type: 'bool' },
      ]} />
      <CrudTable table="promotions" rows={promos || []} title={{ ar: 'بنرات العروض في الصفحة الرئيسية', en: 'Homepage promo banners' }} defaults={{ is_active: true }} fields={[
        { key: 'title_ar', ar: 'العنوان عربي', en: 'Title AR', required: true }, { key: 'title_en', ar: 'العنوان إنجليزي', en: 'Title EN', required: true },
        { key: 'body_ar', ar: 'النص عربي', en: 'Body AR', list: false }, { key: 'body_en', ar: 'النص إنجليزي', en: 'Body EN', list: false },
        { key: 'link_url', ar: 'الرابط (/products…)', en: 'Link (/products…)', dir: 'ltr' },
        { key: 'starts_at', ar: 'يبدأ', en: 'Starts', type: 'datetime' }, { key: 'ends_at', ar: 'ينتهي', en: 'Ends', type: 'datetime' },
        { key: 'sort_order', ar: 'الترتيب', en: 'Order', type: 'number' }, { key: 'is_active', ar: 'مفعل', en: 'Active', type: 'bool' },
      ]} />
    </div>
  );
}
