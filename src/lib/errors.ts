import type { Locale } from './format';
const M: Record<string, [string, string]> = {
  AUTH_REQUIRED: ['يجب تسجيل الدخول أولاً', 'Please sign in first'],
  EMPTY_CART: ['السلة فارغة', 'Your cart is empty'],
  PRODUCT_UNAVAILABLE: ['أحد المنتجات لم يعد متاحاً', 'A product is no longer available'],
  INSUFFICIENT_STOCK: ['الكمية المطلوبة غير متوفرة في المخزون', 'Not enough stock for the requested quantity'],
  MAX_PER_ORDER: ['تجاوزت الحد الأقصى لعدد الرؤوس في الطلب', 'Maximum animals per order exceeded'],
  INVALID_QUANTITY: ['كمية غير صالحة', 'Invalid quantity'],
  SERVICE_UNAVAILABLE: ['خدمة التجهيز المختارة غير متاحة', 'Selected preparation service is unavailable'],
  ANIMAL_SELECTION_DISABLED: ['اختيار رأس محدد غير مفعّل', 'Specific animal selection is disabled'],
  ANIMAL_UNAVAILABLE: ['أحد الرؤوس المختارة لم يعد متاحاً', 'A selected animal is no longer available'],
  ZONE_UNAVAILABLE: ['منطقة التوصيل غير متاحة', 'Delivery zone unavailable'],
  BELOW_ZONE_MINIMUM: ['قيمة الطلب أقل من الحد الأدنى لهذه المنطقة', 'Order is below the minimum for this zone'],
  PAYMENT_METHOD_UNAVAILABLE: ['طريقة الدفع غير متاحة', 'Payment method unavailable'],
  ADDRESS_REQUIRED: ['يرجى اختيار عنوان التوصيل', 'Please choose a delivery address'],
  SLOT_UNAVAILABLE: ['موعد التوصيل غير متاح', 'Delivery slot unavailable'],
  DATE_UNAVAILABLE: ['لا يوجد توصيل في هذا اليوم', 'No delivery on this date'],
  SLOT_TOO_SOON: ['الموعد قريب جداً، اختر موعداً لاحقاً', 'This slot is too soon, choose a later one'],
  DATE_TOO_FAR: ['التاريخ بعيد جداً', 'Date is too far ahead'],
  SLOT_FULL: ['هذا الموعد مكتمل، اختر موعداً آخر', 'This slot is full, choose another'],
  INVALID_NAME: ['الاسم غير صالح', 'Invalid name'],
  INVALID_PHONE: ['رقم الجوال يجب أن يكون سعودياً بصيغة 05xxxxxxxx', 'Phone must be a Saudi mobile (05xxxxxxxx)'],
  INVALID_EMAIL: ['البريد الإلكتروني غير صالح', 'Invalid email'],
  PRICE_CHANGED: ['تغيّر السعر، يرجى مراجعة الإجمالي', 'Prices changed, please review the total'],
  RATE_LIMITED: ['محاولات كثيرة، حاول لاحقاً', 'Too many attempts, try again later'],
  COUPON_INVALID: ['كود الخصم غير صالح', 'Invalid coupon'],
  COUPON_EXPIRED: ['انتهت صلاحية الكود', 'Coupon expired'],
  COUPON_NOT_STARTED: ['الكود لم يبدأ بعد', 'Coupon not active yet'],
  COUPON_USAGE_LIMIT: ['تم استنفاد استخدامات الكود', 'Coupon usage limit reached'],
  COUPON_CUSTOMER_LIMIT: ['استخدمت هذا الكود من قبل', 'You already used this coupon'],
  COUPON_NOT_ELIGIBLE: ['الكود غير متاح لحسابك', 'Coupon not available for your account'],
  COUPON_LOGIN_REQUIRED: ['سجّل الدخول لاستخدام الكود', 'Sign in to use this coupon'],
  COUPON_MIN_SUBTOTAL: ['لم تصل للحد الأدنى للكود', 'Minimum amount for coupon not reached'],
  COUPON_MIN_QUANTITY: ['لم تصل للحد الأدنى لعدد الرؤوس', 'Minimum quantity for coupon not reached'],
  COUPON_NOT_COMBINABLE: ['لا يمكن دمج الكود مع خصم الكمية', 'Coupon cannot be combined with quantity discount'],
  INVALID_TRANSITION: ['انتقال حالة غير مسموح', 'Status change not allowed'],
  PAYMENT_NOT_VERIFIED: ['لم يتم التحقق من الدفع بعد', 'Payment not verified yet'],
  PAID_REQUIRES_VERIFIED_PAYMENT: ['لا يمكن تعيين "مدفوع" يدوياً للدفع الإلكتروني', 'Paid can only be set by verified payment'],
  STAGE_NOT_APPLICABLE: ['هذه المرحلة لا تنطبق على خدمة الطلب', 'Stage not applicable to this order'],
  USE_REFUND: ['استخدم نموذج الاسترداد', 'Use the refund form'],
  NOTHING_TO_REFUND: ['لا يوجد مبلغ مدفوع لاسترداده', 'Nothing paid to refund'],
  REFUND_EXCEEDS: ['المبلغ يتجاوز المتبقي', 'Amount exceeds refundable balance'],
  NEGATIVE_STOCK: ['لا يمكن أن يصبح المخزون سالباً', 'Stock cannot go negative'],
  USE_ANIMAL_RECORDS: ['هذا المنتج يدار بسجلات الرؤوس', 'This product uses individual animal records'],
  USER_NOT_FOUND: ['المستخدم غير مسجل', 'User not found'],
  LAST_OWNER: ['لا يمكن إزالة آخر مالك', 'Cannot remove the last owner'],
  REVIEW_NOT_ALLOWED: ['يمكنك التقييم بعد استلام طلب يحتوي هذا المنتج', 'You can review after receiving this product'],
  INVOICE_REQUIRES_PAYMENT: ['الفاتورة تصدر بعد الدفع', 'Invoice requires payment'],
  forbidden: ['غير مصرح', 'Not authorized'],
};
export function errorText(raw: unknown, locale: Locale): string {
  const msg = typeof raw === 'string' ? raw : (raw as { message?: string })?.message || '';
  const detail = (raw as { details?: string })?.details || '';
  let code = Object.keys(M).find((k) => msg.includes(k));
  if (code === undefined && /PRICING_ERROR|COUPON_ERROR/.test(msg)) code = Object.keys(M).find((k) => detail.includes(k));
  if (!code && /violates check constraint/.test(msg)) return locale === 'ar' ? 'بيانات غير صالحة' : 'Invalid data';
  if (!code) return locale === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again';
  return M[code][locale === 'ar' ? 0 : 1];
}
export function codeText(code: string, locale: Locale) {
  return M[code] ? M[code][locale === 'ar' ? 0 : 1] : code;
}
