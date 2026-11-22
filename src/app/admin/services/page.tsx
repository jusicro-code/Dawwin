import { createClient } from '@/lib/supabase/server';
import { CrudTable } from '@/components/admin/CrudTable';
export default async function Services() {
  const sb = await createClient();
  const { data } = await sb.from('preparation_services').select('*').order('sort_order');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">خدمات الذبح والتجهيز · Preparation services</h1>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
        لا تفعّل خدمات الذبح إلا إذا كان المتجر مرخّصاً نظامياً ومجهّزاً لتقديمها. يجب تأكيد الترخيص (الحقل «مرخّص ومؤهل») قبل التفعيل، وإلا سيرفض النظام التفعيل.
        <br />Only enable slaughter services if the store is legally licensed and equipped. The &quot;Authorized&quot; confirmation is required before enabling; the database rejects it otherwise.
      </div>
      <CrudTable table="preparation_services" rows={data || []} canCreate={false} canDelete={false} fields={[
        { key: 'name_ar', ar: 'الاسم عربي', en: 'Name AR', required: true }, { key: 'name_en', ar: 'الاسم إنجليزي', en: 'Name EN', required: true },
        { key: 'price', ar: 'السعر لكل رأس', en: 'Price per animal', type: 'number', required: true },
        { key: 'estimated_minutes', ar: 'الوقت التقديري (دقيقة)', en: 'Est. time (min)', type: 'number' },
        { key: 'description_ar', ar: 'الوصف عربي', en: 'Description AR', list: false, type: 'textarea' }, { key: 'description_en', ar: 'الوصف إنجليزي', en: 'Description EN', list: false, type: 'textarea' },
        { key: 'owner_confirmed_authorized', ar: 'مرخّص ومؤهل', en: 'Authorized & equipped', type: 'bool' },
        { key: 'is_enabled', ar: 'مفعّل للعملاء', en: 'Enabled for customers', type: 'bool' },
        { key: 'sort_order', ar: 'الترتيب', en: 'Order', type: 'number', list: false },
      ]} />
    </div>
  );
}
