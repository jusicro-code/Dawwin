import { createClient } from '@/lib/supabase/server';
import { CrudTable } from '@/components/admin/CrudTable';
export default async function Delivery() {
  const sb = await createClient();
  const [{ data: zones }, { data: slots }, { data: blackouts }, { data: personnel }] = await Promise.all([
    sb.from('delivery_zones').select('*').order('sort_order'), sb.from('delivery_slots').select('*').order('start_time'),
    sb.from('delivery_blackout_dates').select('*').order('day'), sb.from('delivery_personnel').select('*').order('full_name'),
  ]);
  const zoneOpts = (zones || []).map((z) => ({ value: z.id, ar: z.city_ar, en: z.city_en }));
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((ar, i) => ({ value: String(i), ar, en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i] }));
  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">التوصيل · Delivery</h1>
      <p className="text-sm text-ink/60">التوصيل إلى المنازل فقط · Home delivery only.</p>
      <CrudTable table="delivery_zones" rows={zones || []} title={{ ar: 'مناطق التوصيل والرسوم', en: 'Delivery zones & fees' }} defaults={{ is_active: true, fee: 0 }} fields={[
        { key: 'city_ar', ar: 'المنطقة/المدينة عربي', en: 'Zone/city AR', required: true }, { key: 'city_en', ar: 'المنطقة/المدينة إنجليزي', en: 'Zone/city EN', required: true },
        { key: 'fee', ar: 'رسوم التوصيل', en: 'Delivery fee', type: 'number', required: true },
        { key: 'free_delivery_min_subtotal', ar: 'توصيل مجاني فوق', en: 'Free delivery above', type: 'number' },
        { key: 'min_order_subtotal', ar: 'حد أدنى للطلب', en: 'Min. order', type: 'number' },
        { key: 'neighborhoods', ar: 'الأحياء (مفصولة بفاصلة)', en: 'Districts (comma separated)', type: 'array', list: false },
        { key: 'sort_order', ar: 'الترتيب', en: 'Order', type: 'number', list: false }, { key: 'is_active', ar: 'مفعل', en: 'Active', type: 'bool' },
      ]} />
      <CrudTable table="delivery_slots" rows={slots || []} title={{ ar: 'فترات التوصيل', en: 'Delivery time slots' }} defaults={{ is_active: true, capacity: 20, min_lead_hours: 12 }} fields={[
        { key: 'start_time', ar: 'من', en: 'From', type: 'time', required: true }, { key: 'end_time', ar: 'إلى', en: 'To', type: 'time', required: true },
        { key: 'weekday', ar: 'اليوم (فارغ = كل يوم)', en: 'Weekday (empty = daily)', type: 'select', nullable: true, options: days },
        { key: 'zone_id', ar: 'المنطقة (فارغ = الكل)', en: 'Zone (empty = all)', type: 'select', nullable: true, options: zoneOpts },
        { key: 'capacity', ar: 'السعة (طلبات)', en: 'Capacity (orders)', type: 'number', required: true },
        { key: 'min_lead_hours', ar: 'أقل مهلة (ساعات)', en: 'Min. lead (hours)', type: 'number' }, { key: 'is_active', ar: 'مفعل', en: 'Active', type: 'bool' },
      ]} />
      <CrudTable table="delivery_blackout_dates" pk="day" rows={blackouts || []} title={{ ar: 'أيام بدون توصيل', en: 'No-delivery dates' }} fields={[
        { key: 'day', ar: 'التاريخ', en: 'Date', type: 'date', required: true }, { key: 'reason', ar: 'السبب', en: 'Reason' },
      ]} />
      <CrudTable table="delivery_personnel" rows={personnel || []} title={{ ar: 'المندوبون', en: 'Delivery personnel' }} defaults={{ is_active: true }} fields={[
        { key: 'full_name', ar: 'الاسم', en: 'Name', required: true }, { key: 'phone', ar: 'الجوال (+9665…)', en: 'Phone (+9665…)', required: true, dir: 'ltr' }, { key: 'is_active', ar: 'نشط', en: 'Active', type: 'bool' },
      ]} />
    </div>
  );
}
