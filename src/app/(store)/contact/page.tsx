import { getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { waLink } from '@/lib/format';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { Mail, Phone, MapPin, Instagram } from '@/components/icons';
export default async function Contact() {
  const [{ locale, t }, s] = await Promise.all([getT(), getSettings()]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.nav_contact}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href={waLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 hover:border-brand" data-testid="contact-whatsapp">
          <WhatsAppIcon className="h-8 w-8 text-[#25D366]" /><div><div className="font-semibold">WhatsApp</div><div className="text-sm text-ink/70" dir="ltr" data-testid="contact-number">{s.whatsapp_number}</div></div>
        </a>
        <a href={`tel:${s.contact_phone || s.whatsapp_number}`} className="card flex items-center gap-3 hover:border-brand">
          <Phone className="h-7 w-7 text-brand" /><div><div className="font-semibold">{t.phone}</div><div className="text-sm text-ink/70" dir="ltr">{s.contact_phone || s.whatsapp_number}</div></div>
        </a>
        {s.contact_email && <a href={`mailto:${s.contact_email}`} className="card flex items-center gap-3 hover:border-brand"><Mail className="h-7 w-7 text-brand" /><div><div className="font-semibold">{t.email}</div><div className="text-sm text-ink/70">{s.contact_email}</div></div></a>}
        {(s.address_ar || s.address_en) && <div className="card flex items-center gap-3"><MapPin className="h-7 w-7 text-brand" /><div className="text-sm">{locale === 'ar' ? s.address_ar : s.address_en}</div></div>}
        {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 hover:border-brand"><Instagram className="h-7 w-7 text-brand" /><div className="font-semibold">Instagram</div></a>}
        {s.tiktok_url && <a href={s.tiktok_url} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 hover:border-brand"><span className="text-lg font-bold">TikTok</span></a>}
      </div>
    </div>
  );
}
