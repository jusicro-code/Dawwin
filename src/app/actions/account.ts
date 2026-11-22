'use server';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/i18n/server';
import { errorText } from '@/lib/errors';
import { normalizeSaPhone } from '@/lib/format';
export async function updateProfile(v: { full_name: string; phone: string; preferred_language: string }) {
  const locale = await getLocale();
  const phone = v.phone ? normalizeSaPhone(v.phone) : null;
  if (v.phone && !phone) return { error: errorText('INVALID_PHONE', locale) };
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: errorText('AUTH_REQUIRED', locale) };
  const { error } = await sb.from('profiles').update({ full_name: v.full_name.trim().slice(0, 120) || null, phone, preferred_language: v.preferred_language === 'en' ? 'en' : 'ar' }).eq('id', user.id);
  return error ? { error: errorText(error, locale) } : {};
}
