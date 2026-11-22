import Link from 'next/link';
import type { Settings } from '@/lib/types';
import type { Locale } from '@/lib/format';
export function Logo({ settings, locale, href = '/', size = 'md', light = false }: { settings: Settings; locale: Locale; href?: string; size?: 'md' | 'lg'; light?: boolean }) {
  const name = locale === 'ar' ? settings.store_name_ar : settings.store_name_en;
  const sub = locale === 'ar' ? settings.store_name_en : settings.store_name_ar;
  const img = settings.logo_url || '/brand/logo-160.png';
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={name} className={`${size === 'lg' ? 'h-16 w-16' : 'h-10 w-10'} shrink-0 rounded-xl bg-sand-50 object-contain p-0.5 ring-1 ring-gold/40`} />
      <span className="flex flex-col leading-tight">
        <span className={`${size === 'lg' ? 'text-2xl' : 'text-[17px]'} font-bold tracking-tight ${light ? 'text-white' : 'text-brand'}`}>{name}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${light ? 'text-gold' : 'text-gold-dark'}`}>{sub}</span>
      </span>
    </Link>
  );
}
