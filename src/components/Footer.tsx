import Link from 'next/link';
import { getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { waLink } from '@/lib/format';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Instagram, Mail, Phone } from './icons';

function TikTok({ className = 'h-5 w-5' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.59-2.6 2.6 2.6 0 0 1 3.36-2.48V9.66a5.7 5.7 0 0 0-.77-.05A5.69 5.69 0 0 0 4.17 15.3 5.69 5.69 0 0 0 9.86 21a5.69 5.69 0 0 0 5.68-5.69V9.01a7.35 7.35 0 0 0 4.29 1.37V7.3s-1.88.09-3.23-1.48" /></svg>;
}

export async function Footer() {
  const [{ locale, t }, s] = await Promise.all([getT(), getSettings()]);
  const name = locale === 'ar' ? s.store_name_ar : s.store_name_en;
  return (
    <footer className="mt-20 border-t border-sand-200 bg-ink text-sand-100">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-lg font-bold text-white">{name}</div>
          <p className="mt-2 max-w-md text-sm leading-7 text-sand-200/80">{t.footer_tag}</p>
          <div className="mt-4 flex items-center gap-2">
            <a href={waLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="footer-social"><WhatsAppIcon /></a>
            {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social"><Instagram className="h-5 w-5" /></a>}
            {s.tiktok_url && <a href={s.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="footer-social"><TikTok /></a>}
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-white">{t.policies}</div>
          <ul className="space-y-2 text-sm text-sand-200/80">
            <li><Link href="/privacy" className="hover:text-white">{t.privacy}</Link></li>
            <li><Link href="/terms" className="hover:text-white">{t.terms}</Link></li>
            <li><Link href="/shipping" className="hover:text-white">{t.shipping}</Link></li>
            <li><Link href="/returns" className="hover:text-white">{t.returns}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-white">{t.nav_contact}</div>
          <ul className="space-y-2 text-sm text-sand-200/80">
            <li><a href={waLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" /><span dir="ltr">{s.whatsapp_number}</span></a></li>
            {s.contact_email && <li><a href={`mailto:${s.contact_email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" />{s.contact_email}</a></li>}
            <li><Link href="/contact" className="hover:text-white">{t.nav_contact}</Link></li>
            <li><Link href="/about" className="hover:text-white">{t.nav_about}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-sand-200/60">
          <span>© {new Date().getFullYear()} {name} — {t.rights}</span>
          <span className="flex gap-4">
            {s.commercial_registration_no && <span>{t.cr}: {s.commercial_registration_no}</span>}
            {s.vat_registration_no && <span>{t.vat_no}: {s.vat_registration_no}</span>}
          </span>
        </div>
      </div>
    </footer>
  );
}
