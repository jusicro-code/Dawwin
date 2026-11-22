import Link from 'next/link';
import { getSettings, getUser, getRoles } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { CartBadge } from './CartBadge';
import { LangSwitch } from './LangSwitch';
import { MobileMenu } from './MobileMenu';
import { Search, User, LayoutDashboard } from './icons';
import { Logo } from './Logo';

export async function Header() {
  const [{ locale, t }, s, user] = await Promise.all([getT(), getSettings(), getUser()]);
  const roles = user ? await getRoles() : [];
  const links = [
    { href: '/products', label: t.nav_shop }, { href: '/products?category=sheep', label: t.nav_sheep },
    { href: '/products?category=goats', label: t.nav_goats }, { href: '/products?offers=1', label: t.nav_offers },
    { href: '/track', label: t.nav_track }, { href: '/about', label: t.nav_about }, { href: '/contact', label: t.nav_contact },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-sand-200/80 bg-sand-50/95 backdrop-blur">
      <div className="h-1 bg-gradient-to-l from-gold via-gold/70 to-brand" />
      <div className="relative mx-auto flex h-16 max-w-page items-center gap-3 px-4">
        <MobileMenu links={links} logo={s.logo_url || '/brand/logo-160.png'} name={locale === 'ar' ? s.store_name_ar : s.store_name_en} />
        <Logo settings={s} locale={locale} />
        <nav className="ms-6 hidden items-center gap-1 lg:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-sm text-ink/80 hover:bg-sand-100 hover:text-ink">{l.label}</Link>)}
        </nav>
        <form action="/products" className="ms-auto hidden max-w-xs flex-1 md:flex">
          <label className="relative w-full">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input name="q" placeholder={t.search_placeholder} aria-label={t.search} className="input h-10 rounded-full ps-9 text-sm" />
          </label>
        </form>
        <div className="ms-auto flex items-center gap-1 md:ms-2">
          <LangSwitch className="hidden sm:inline-flex" />
          {roles.length > 0 && (
            <Link href="/admin" aria-label={t.nav_admin} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand-100"><LayoutDashboard className="h-5 w-5" /></Link>
          )}
          <Link href={user ? '/account' : '/login'} aria-label={user ? t.nav_account : t.nav_login} data-testid="account-link" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand-100"><User className="h-5 w-5" /></Link>
          <CartBadge />
        </div>
      </div>
      <div className="border-t border-sand-200/70 px-4 py-2 md:hidden">
        <form action="/products" className="flex gap-2">
          <input name="q" placeholder={t.search_placeholder} aria-label={t.search} className="input h-10 rounded-full text-sm" />
          <LangSwitch />
        </form>
      </div>
    </header>
  );
}
