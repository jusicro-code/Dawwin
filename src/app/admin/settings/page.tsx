import { createClient } from '@/lib/supabase/server';
import { L } from '@/lib/admin';
import { providerConfigured, serverEnv } from '@/lib/server-env';
import { GOOGLE_AUTH_ENABLED, SITE_URL } from '@/lib/env';
import { CrudTable, type Field } from '@/components/admin/CrudTable';

export default async function Settings() {
  const { L: tr } = await L();
  const sb = await createClient();
  const { data: s } = await sb.from('store_settings').select('*').eq('id', 1).single();
  const rows = s ? [s] : [];
  const group = (title: { ar: string; en: string }, fields: Field[]) => <CrudTable table="store_settings" rows={rows} canCreate={false} canDelete={false} title={title} fields={fields.map((f) => ({ ...f, list: f.list ?? true }))} />;
  const status = (ok: boolean) => <span className={`badge ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{ok ? tr('مهيأ', 'Configured') : tr('بانتظار البيانات', 'Pending credentials')}</span>;
  const integrations: [string, boolean, string][] = [
    ['Moyasar (mada / Apple Pay / Visa / Mastercard)', providerConfigured.moyasar() && !!serverEnv.moyasar.webhookSecret, 'MOYASAR_SECRET_KEY, MOYASAR_PUBLISHABLE_KEY, MOYASAR_WEBHOOK_SECRET'],
    ['Tabby', providerConfigured.tabby() && !!serverEnv.tabby.webhookSecret, 'TABBY_SECRET_KEY, TABBY_PUBLIC_KEY, TABBY_MERCHANT_CODE, TABBY_WEBHOOK_SECRET'],
    ['Tamara', providerConfigured.tamara(), 'TAMARA_API_TOKEN, TAMARA_NOTIFICATION_TOKEN, TAMARA_API_BASE_URL'],
    ['WhatsApp Cloud API', providerConfigured.whatsapp(), 'WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_ORDER_UPDATE'],
    ['Google Sign-in', GOOGLE_AUTH_ENABLED, 'Supabase Auth → Providers → Google, NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true'],
    ['Server RPC secret', !!serverEnv.internalSecret, 'INTERNAL_RPC_SECRET'], ['Cron', !!serverEnv.cronSecret, 'CRON_SECRET'],
  ];
  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">{tr('الإعدادات', 'Settings')}</h1>
      {group({ ar: 'هوية المتجر', en: 'Store identity' }, [
        { key: 'store_name_ar', ar: 'اسم المتجر عربي', en: 'Store name AR', required: true }, { key: 'store_name_en', ar: 'اسم المتجر إنجليزي', en: 'Store name EN', required: true },
        { key: 'is_name_temporary', ar: 'الاسم مؤقت', en: 'Name is temporary', type: 'bool' }, { key: 'logo_url', ar: 'رابط الشعار (https)', en: 'Logo URL (https)', dir: 'ltr', list: false },
      ])}
      {group({ ar: 'التواصل والتواصل الاجتماعي', en: 'Contact & social' }, [
        { key: 'whatsapp_number', ar: 'رقم واتساب (+9665xxxxxxxx)', en: 'WhatsApp (+9665xxxxxxxx)', required: true, dir: 'ltr' },
        { key: 'contact_phone', ar: 'هاتف التواصل', en: 'Contact phone', dir: 'ltr' }, { key: 'contact_email', ar: 'البريد', en: 'Email', dir: 'ltr' },
        { key: 'instagram_url', ar: 'إنستغرام', en: 'Instagram URL', dir: 'ltr', list: false }, { key: 'tiktok_url', ar: 'تيك توك', en: 'TikTok URL', dir: 'ltr', list: false },
        { key: 'address_ar', ar: 'العنوان عربي', en: 'Address AR', list: false }, { key: 'address_en', ar: 'العنوان إنجليزي', en: 'Address EN', list: false },
      ])}
      {group({ ar: 'البيانات النظامية والضريبة', en: 'Legal & tax' }, [
        { key: 'legal_name_ar', ar: 'الاسم النظامي عربي', en: 'Legal name AR' }, { key: 'legal_name_en', ar: 'الاسم النظامي إنجليزي', en: 'Legal name EN', list: false },
        { key: 'commercial_registration_no', ar: 'السجل التجاري', en: 'CR number', dir: 'ltr' }, { key: 'vat_registration_no', ar: 'الرقم الضريبي (15 رقم)', en: 'VAT number (15 digits)', dir: 'ltr' },
        { key: 'vat_enabled', ar: 'تفعيل الضريبة', en: 'VAT enabled', type: 'bool' }, { key: 'vat_rate', ar: 'نسبة الضريبة %', en: 'VAT rate %', type: 'number' },
        { key: 'prices_include_vat', ar: 'الأسعار شاملة الضريبة', en: 'Prices include VAT', type: 'bool' },
        { key: 'vat_exempt', ar: 'معفى من الضريبة', en: 'VAT exempt', type: 'bool' }, { key: 'vat_exemption_reason', ar: 'سبب الإعفاء', en: 'Exemption reason', list: false },
      ])}
      {group({ ar: 'المدفوعات', en: 'Payments' }, [
        { key: 'cod_enabled', ar: 'الدفع عند الاستلام', en: 'Cash on delivery', type: 'bool' },
        { key: 'moyasar_enabled', ar: 'ميسر', en: 'Moyasar', type: 'bool' },
        { key: 'tabby_merchant_approved', ar: 'تمت موافقة تابي على التاجر والنشاط', en: 'Tabby merchant & category approved', type: 'bool' }, { key: 'tabby_enabled', ar: 'تابي', en: 'Tabby', type: 'bool' },
        { key: 'tamara_merchant_approved', ar: 'تمت موافقة تمارا على التاجر والنشاط', en: 'Tamara merchant & category approved', type: 'bool' }, { key: 'tamara_enabled', ar: 'تمارا', en: 'Tamara', type: 'bool' },
        { key: 'unpaid_order_expiry_minutes', ar: 'مهلة الدفع (دقيقة)', en: 'Unpaid expiry (min)', type: 'number' },
      ])}
      {group({ ar: 'الطلبات والإشعارات', en: 'Orders & notifications' }, [
        { key: 'max_animals_per_order', ar: 'أقصى عدد رؤوس للطلب', en: 'Max animals per order', type: 'number' },
        { key: 'individual_animal_selection_enabled', ar: 'السماح باختيار رأس محدد', en: 'Allow choosing specific animal', type: 'bool' },
        { key: 'whatsapp_notifications_enabled', ar: 'إشعارات واتساب', en: 'WhatsApp notifications', type: 'bool' },
        { key: 'email_notifications_enabled', ar: 'إشعارات البريد', en: 'Email notifications', type: 'bool' },
        { key: 'admin_notification_phone', ar: 'جوال تنبيهات الإدارة', en: 'Admin alert phone', dir: 'ltr' },
      ])}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">{tr('حالة التكاملات (تُضبط كمتغيرات بيئة آمنة على الخادم)', 'Integration status (server-side environment variables)')}</h2>
        <p className="text-xs text-ink/60">{tr('لا تظهر المفاتيح السرية هنا أبداً. تُعرض طرق الدفع للعملاء فقط عند تفعيلها أعلاه ووجود المفاتيح.', 'Secret values are never shown. Payment methods appear to customers only when enabled above AND credentials exist.')}</p>
        <table className="table text-sm"><tbody>{integrations.map(([n, ok, vars]) => <tr key={n}><td className="font-medium">{n}</td><td>{status(ok)}</td><td className="text-xs text-ink/50" dir="ltr">{vars}</td></tr>)}</tbody></table>
        <div className="text-xs text-ink/60" dir="ltr">Webhooks: {SITE_URL}/api/webhooks/moyasar · /api/webhooks/tabby · /api/webhooks/tamara</div>
      </section>
    </div>
  );
}
