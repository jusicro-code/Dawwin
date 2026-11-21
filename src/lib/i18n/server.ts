import 'server-only';
import { cookies } from 'next/headers';
import { dictionaries } from './dict';
import type { Locale } from '../format';
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get('lang')?.value;
  return c === 'en' ? 'en' : 'ar';
}
export async function getT() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale], dir: locale === 'ar' ? 'rtl' : 'ltr' } as const;
}
