import type { Media } from './media';
export type Settings = {
  store_name_ar: string; store_name_en: string; is_name_temporary: boolean; logo_url: string | null;
  brand_colors: { primary?: string; accent?: string }; whatsapp_number: string; contact_phone: string | null; contact_email: string | null;
  address_ar: string | null; address_en: string | null; instagram_url: string | null; tiktok_url: string | null;
  legal_name_ar: string | null; legal_name_en: string | null; commercial_registration_no: string | null; vat_registration_no: string | null;
  vat_enabled: boolean; vat_rate: number | null; prices_include_vat: boolean; vat_exempt: boolean; vat_exemption_reason: string | null;
  individual_animal_selection_enabled: boolean; moyasar_enabled: boolean; tabby_enabled: boolean; tamara_enabled: boolean; cod_enabled: boolean;
  tabby_merchant_approved: boolean; tamara_merchant_approved: boolean; unpaid_order_expiry_minutes: number; max_animals_per_order: number;
  whatsapp_notifications_enabled: boolean; email_notifications_enabled: boolean; admin_notification_phone: string | null; licenses: unknown;
};
export type Category = { id: string; slug: string; name_ar: string; name_en: string; description_ar: string | null; description_en: string | null; sort_order: number; is_active: boolean };
export type Product = {
  id: string; category_id: string; slug: string; name_ar: string; name_en: string; description_ar: string | null; description_en: string | null;
  price: number; compare_at_price: number | null; wholesale_price: number | null; inventory_mode: 'quantity' | 'individual';
  stock_quantity: number; low_stock_threshold: number; is_hidden: boolean; is_archived: boolean; is_featured: boolean; is_new_arrival: boolean;
  sort_order: number; created_at: string; product_images?: Media[]; categories?: Pick<Category, 'slug' | 'name_ar' | 'name_en'>;
};
export type PrepService = { id: string; code: string; name_ar: string; name_en: string; description_ar: string | null; description_en: string | null; price: number; estimated_minutes: number | null; is_enabled: boolean; owner_confirmed_authorized: boolean; stages: string[]; sort_order: number };
export type Quote = {
  lines: Array<{ product_id: string; name_ar: string; name_en: string; quantity: number; unit_price: number; line_subtotal: number; preparation_code: string; preparation_name_ar: string; preparation_name_en: string; preparation_total: number; bulk_discount: number }>;
  errors: Array<{ code: string; product_id?: string; available?: number }>;
  items_subtotal: number; bulk_discount: number; coupon_code: string | null; coupon_error: string | null; coupon_discount: number;
  preparation_total: number; delivery_fee: number; taxable_amount: number; vat_rate: number | null; vat_amount: number; vat_enabled: boolean;
  prices_include_vat: boolean; total: number; total_quantity: number;
};
export function stockStatus(p: Pick<Product, 'stock_quantity' | 'low_stock_threshold' | 'is_hidden'>) {
  if (p.is_hidden) return 'hidden' as const;
  if (p.stock_quantity <= 0) return 'sold_out' as const;
  if (p.stock_quantity <= p.low_stock_threshold) return 'low_stock' as const;
  return 'available' as const;
}
