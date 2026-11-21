import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { getLocale } from '@/lib/i18n/server';
import { LocaleProvider } from '@/lib/i18n/client';
import { CartProvider } from '@/components/CartProvider';
import { getSettings } from '@/lib/data';

const font = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const [s, locale] = await Promise.all([getSettings(), getLocale()]);
  const name = locale === 'ar' ? s?.store_name_ar : s?.store_name_en;
  return {
    title: { default: name || 'Store', template: `%s · ${name}` },
    description: locale === 'ar' ? 'متجر مواشٍ إلكتروني: خراف سواكني وحري وتيوس مع التوصيل للمنازل.' : 'Online livestock store: Sawakni & Harri sheep and male goats with home delivery.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  };
}
export const viewport: Viewport = { themeColor: '#7a4b2a', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, s] = await Promise.all([getLocale(), getSettings()]);
  const style = { '--brand': s?.brand_colors?.primary || '#7a4b2a', '--accent': s?.brand_colors?.accent || '#b08d57' } as React.CSSProperties;
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={font.variable} style={style}>
      <body className="min-h-screen font-sans">
        <LocaleProvider locale={locale}>
          <CartProvider>{children}</CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
