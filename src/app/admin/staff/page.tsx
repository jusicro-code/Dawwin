import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { StaffManager } from '@/components/admin/StaffManager';
export default async function Staff() {
  const { L: tr } = await L();
  const sb = await createClient();
  const { data } = await sb.rpc('admin_list_staff');
  return <div className="space-y-4"><h1 className="text-2xl font-bold">{tr('المستخدمون والصلاحيات', 'Staff & roles')}</h1><StaffManager staff={data || []} /></div>;
}
