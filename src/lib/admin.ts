import 'server-only';
import { getLocale } from './i18n/server';
export async function L() { const l = await getLocale(); return { locale: l, L: (ar: string, en: string) => (l === 'ar' ? ar : en) }; }
export function periodRange(p?: string) {
  const now = new Date();
  const start = new Date(now);
  switch (p) {
    case 'today': start.setUTCHours(-3, 0, 0, 0); break; // Riyadh midnight (UTC+3)
    case 'week': start.setDate(now.getDate() - 7); break;
    case 'year': start.setFullYear(now.getFullYear() - 1); break;
    case 'all': start.setFullYear(2000); break;
    default: start.setDate(now.getDate() - 30);
  }
  const end = new Date(now.getTime() + 60_000);
  return { from: start.toISOString(), to: end.toISOString(), key: p || 'month' };
}
