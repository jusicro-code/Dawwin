import type { Locale } from './format';
export const ORDER_FLOW = ['awaiting_payment', 'paid', 'confirmed', 'preparing', 'slaughtering', 'cleaning_cutting', 'packaging', 'ready_for_delivery', 'out_for_delivery', 'delivered'] as const;
const PREP_STAGES: Record<string, string[]> = {
  live: [], slaughter: ['slaughtering'], slaughter_clean: ['slaughtering', 'cleaning_cutting'], slaughter_clean_cut_pack: ['slaughtering', 'cleaning_cutting', 'packaging'],
};
export function relevantFlow(prepCodes: string[], method: string) {
  const stages = new Set(prepCodes.flatMap((c) => PREP_STAGES[c] || []));
  return ORDER_FLOW.filter((s) => (['slaughtering', 'cleaning_cutting', 'packaging'].includes(s) ? stages.has(s) : true) && !(s === 'paid' && method === 'cod'));
}
const L: Record<string, [string, string]> = {
  awaiting_payment: ['بانتظار الدفع', 'Awaiting payment'], paid: ['مدفوع', 'Paid'], confirmed: ['مؤكد', 'Confirmed'], preparing: ['قيد التجهيز', 'Preparing'],
  slaughtering: ['قيد الذبح', 'Slaughtering'], cleaning_cutting: ['التنظيف والتقطيع', 'Cleaning & cutting'], packaging: ['التغليف', 'Packaging'],
  ready_for_delivery: ['جاهز للتوصيل', 'Ready for delivery'], out_for_delivery: ['خرج للتوصيل', 'Out for delivery'], delivered: ['تم التوصيل', 'Delivered'],
  cancelled: ['ملغي', 'Cancelled'], refunded: ['مسترد', 'Refunded'],
  initiated: ['لم يبدأ', 'Not started'], pending: ['قيد الانتظار', 'Pending'], authorized: ['مفوّض', 'Authorized'], failed: ['فشل', 'Failed'], expired: ['منتهي', 'Expired'], partially_refunded: ['مسترد جزئياً', 'Partially refunded'],
  unassigned: ['غير مسند', 'Unassigned'], assigned: ['مسند لمندوب', 'Assigned'], picked_up: ['تم الاستلام من المتجر', 'Picked up'],
  cod: ['الدفع عند الاستلام', 'Cash on delivery'], moyasar: ['بطاقة / مدى / Apple Pay', 'Card / mada / Apple Pay'], tabby: ['تابي', 'Tabby'], tamara: ['تمارا', 'Tamara'],
};
export function statusLabel(s: string, locale: Locale, method?: string) {
  if (s === 'awaiting_payment' && method === 'cod') return locale === 'ar' ? 'بانتظار تأكيد المتجر' : 'Awaiting store confirmation';
  return L[s] ? L[s][locale === 'ar' ? 0 : 1] : s;
}
export function statusColor(s: string) {
  if (['delivered', 'paid'].includes(s)) return 'bg-emerald-50 text-emerald-800';
  if (['cancelled', 'failed', 'expired'].includes(s)) return 'bg-red-50 text-red-700';
  if (['refunded', 'partially_refunded'].includes(s)) return 'bg-violet-50 text-violet-700';
  if (s === 'awaiting_payment' || s === 'pending' || s === 'initiated') return 'bg-amber-50 text-amber-800';
  return 'bg-sky-50 text-sky-800';
}
