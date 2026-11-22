import { createClient } from '@/lib/supabase/server';
import { CrudTable } from '@/components/admin/CrudTable';
export default async function Support() {
  const sb = await createClient();
  const { data } = await sb.from('support_requests').select('*').order('created_at', { ascending: false }).limit(300);
  const kinds = [{ value: 'inquiry', ar: 'استفسار', en: 'Inquiry' }, { value: 'complaint', ar: 'شكوى', en: 'Complaint' }, { value: 'order_issue', ar: 'مشكلة طلب', en: 'Order issue' }, { value: 'refund_request', ar: 'طلب استرداد', en: 'Refund request' }];
  const st = [{ value: 'open', ar: 'مفتوح', en: 'Open' }, { value: 'in_progress', ar: 'قيد المعالجة', en: 'In progress' }, { value: 'resolved', ar: 'تم الحل', en: 'Resolved' }, { value: 'closed', ar: 'مغلق', en: 'Closed' }];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الشكاوى والدعم · Support & complaints</h1>
      <CrudTable table="support_requests" rows={data || []} canCreate={false} canDelete={false} fields={[
        { key: 'created_at', ar: 'التاريخ', en: 'Date', type: 'datetime', readOnly: true }, { key: 'kind', ar: 'النوع', en: 'Type', type: 'select', options: kinds, readOnly: true },
        { key: 'name', ar: 'الاسم', en: 'Name', readOnly: true }, { key: 'phone', ar: 'الجوال', en: 'Phone', dir: 'ltr', readOnly: true }, { key: 'email', ar: 'البريد', en: 'Email', dir: 'ltr', list: false, readOnly: true },
        { key: 'order_number', ar: 'الطلب', en: 'Order', dir: 'ltr', readOnly: true }, { key: 'message', ar: 'الرسالة', en: 'Message', type: 'textarea', readOnly: true },
        { key: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: st }, { key: 'staff_reply', ar: 'ملاحظة/رد الفريق', en: 'Staff reply/notes', type: 'textarea', list: false },
      ]} />
    </div>
  );
}
