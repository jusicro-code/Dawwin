import Link from 'next/link';
import type { Settings } from '@/lib/types';
import type { Locale } from '@/lib/format';
export function Logo({ settings, locale, href = '/' }: { settings: Settings; locale: Locale; href?: string }) {
  const name = locale === 'ar' ? settings.store_name_ar : settings.store_name_en;
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={name}>
      {settings.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logo_url} alt={name} className="h-9 w-auto" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">{name.trim().charAt(0)}</span>
      )}
      <span className="text-[17px] font-bold tracking-tight text-ink">{name}</span>
    </Link>
  );
}
