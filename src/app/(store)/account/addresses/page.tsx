import { createClient } from '@/lib/supabase/server';
import { AddressBook } from '@/components/AddressBook';
export const dynamic = 'force-dynamic';
export default async function Addresses() {
  const sb = await createClient();
  const [{ data: list }, { data: zones }] = await Promise.all([
    sb.from('delivery_addresses').select('*').order('is_default', { ascending: false }).order('created_at', { ascending: false }),
    sb.from('delivery_zones').select('*').order('sort_order'),
  ]);
  return <AddressBook addresses={list || []} zones={zones || []} />;
}
