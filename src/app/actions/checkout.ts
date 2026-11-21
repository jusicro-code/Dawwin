'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/i18n/server';
import { errorText } from '@/lib/errors';
import { normalizeSaPhone } from '@/lib/format';
import { startOnlinePayment } from '@/lib/payments';

const addressSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  label: z.string().max(40).optional(),
  recipient_name: z.string().trim().min(2).max(120),
  recipient_phone: z.string(),
  zone_id: z.string().uuid(),
  city: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().min(2).max(80),
  street: z.string().trim().max(160).optional(),
  building_details: z.string().trim().max(160).optional(),
  national_address_short_code: z.string().trim().regex(/^[A-Za-z]{4}[0-9]{4}$/).optional().or(z.literal('')),
  delivery_instructions: z.string().trim().max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
  is_default: z.coerce.boolean().optional(),
});

export async function saveAddress(input: Record<string, unknown>) {
  const locale = await getLocale();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: locale === 'ar' ? 'يرجى التحقق من حقول العنوان' : 'Please check the address fields' };
  const phone = normalizeSaPhone(parsed.data.recipient_phone);
  if (!phone) return { error: errorText('INVALID_PHONE', locale) };
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: errorText('AUTH_REQUIRED', locale) };
  const d = parsed.data;
  const row = {
    user_id: user.id, label: d.label || null, recipient_name: d.recipient_name, recipient_phone: phone, zone_id: d.zone_id,
    city: d.city, neighborhood: d.neighborhood, street: d.street || null, building_details: d.building_details || null,
    national_address_short_code: d.national_address_short_code ? d.national_address_short_code.toUpperCase() : null,
    delivery_instructions: d.delivery_instructions || null,
    latitude: d.latitude === '' || d.latitude === undefined ? null : d.latitude,
    longitude: d.longitude === '' || d.longitude === undefined ? null : d.longitude,
    is_default: !!d.is_default,
  };
  const q = d.id ? sb.from('delivery_addresses').update(row).eq('id', d.id).select('id').single()
                 : sb.from('delivery_addresses').insert(row).select('id').single();
  const { data, error } = await q;
  if (error) return { error: errorText(error, locale) };
  revalidatePath('/account/addresses');
  return { id: data.id as string };
}

export async function deleteAddress(id: string) {
  const sb = await createClient();
  await sb.from('delivery_addresses').delete().eq('id', id);
  revalidatePath('/account/addresses');
}

const orderSchema = z.object({
  idempotency_key: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(), quantity: z.number().int().min(1).max(1000),
    preparation_code: z.string().max(40), animal_ids: z.array(z.string().uuid()).max(1000), instructions: z.string().max(500),
  })).min(1).max(50),
  coupon_code: z.string().max(32).nullable(),
  address_id: z.string().uuid(),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_id: z.string().uuid(),
  payment_method: z.enum(['cod', 'moyasar', 'tabby', 'tamara']),
  customer_name: z.string().trim().min(2).max(120),
  customer_phone: z.string(),
  customer_email: z.string().email().or(z.literal('')).optional(),
  customer_note: z.string().max(1000).optional(),
  expected_total: z.number(),
});

export async function placeOrder(input: unknown): Promise<{ error?: string; orderId?: string; redirect?: string }> {
  const locale = await getLocale();
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { error: locale === 'ar' ? 'بيانات الطلب غير مكتملة' : 'Order details are incomplete' };
  const phone = normalizeSaPhone(parsed.data.customer_phone);
  if (!phone) return { error: errorText('INVALID_PHONE', locale) };
  const sb = await createClient();
  const { data, error } = await sb.rpc('place_order', { p: { ...parsed.data, customer_phone: phone } });
  if (error) return { error: errorText(error, locale) };
  const res = data as { order_id: string; payment_method: string };
  if (res.payment_method === 'cod') return { orderId: res.order_id, redirect: `/orders/${res.order_id}?placed=1` };
  const pay = await startOnlinePayment(res.order_id, locale);
  if ('error' in pay) return { orderId: res.order_id, redirect: `/orders/${res.order_id}?payment_error=1` };
  return { orderId: res.order_id, redirect: pay.url };
}
