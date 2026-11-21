import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
import { getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n/server';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [s, { t }] = await Promise.all([getSettings(), getT()]);
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppFloat phone={s.whatsapp_number} label={t.hero_cta2} />
    </>
  );
}
