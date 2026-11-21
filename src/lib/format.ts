export type Locale = 'ar' | 'en';
export function money(v: number | string | null | undefined, locale: Locale = 'ar') {
  const n = Number(v ?? 0);
  const s = n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  return locale === 'ar' ? `${s} ر.س` : `SAR ${s}`;
}
export function dateFmt(v: string | Date | null | undefined, locale: Locale = 'ar', withTime = false) {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v.length === 10 ? v + 'T00:00:00' : v) : v;
  return d.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: 'short', day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
export function normalizeSaPhone(input: string): string | null {
  const d = (input || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  let local = d;
  if (local.startsWith('966')) local = local.slice(3);
  if (local.startsWith('0')) local = local.slice(1);
  return /^5\d{8}$/.test(local) ? `+966${local}` : null;
}
export function waLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
