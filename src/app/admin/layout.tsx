import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getRoles, getSettings, getUser } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
import { LangSwitch } from '@/components/LangSwitch';
import { Logo } from '@/components/Logo';
import { BarChart3, ClipboardList, Package, Users, Tag, Truck, Settings, Receipt, ShieldCheck, Bell, LayoutDashboard } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login?next=/admin');
  const [roles, { locale }, s] = await Promise.all([getRoles(), getT(), getSettings()]);
  const L = (ar: string, en: string) => (locale === 'ar' ? ar : en);
  if (roles.length === 0) {
    return <div className="mx-auto max-w-md px-4 py-24 text-center" data-testid="admin-forbidden"><h1 className="text-2xl font-bold">403</h1><p className="mt-2 text-ink/60">{L('ليس لديك صلاحية الوصول إلى لوحة التحكم.', 'You do not have access to the dashboard.')}</p><Link href="/" className="btn-primary mt-6">{L('العودة للمتجر', 'Back to store')}</Link></div>;
  }
  const isAdmin = roles.includes('owner') || roles.includes('admin');
  const nav = [
    ['/admin', L('نظرة عامة', 'Overview'), LayoutDashboard, true], ['/admin/orders', L('الطلبات', 'Orders'), ClipboardList, true],
    ['/admin/products', L('المنتجات والمخزون', 'Products & stock'), Package, true], ['/admin/customers', L('العملاء', 'Customers'), Users, true],
    ['/admin/promotions', L('العروض والخصومات', 'Promotions'), Tag, isAdmin], ['/admin/delivery', L('التوصيل', 'Delivery'), Truck, true],
    ['/admin/services', L('خدمات الذبح والتجهيز', 'Preparation services'), ClipboardList, isAdmin], ['/admin/finance', L('التقارير المالية', 'Finance'), BarChart3, isAdmin],
    ['/admin/invoices', L('الفواتير', 'Invoices'), Receipt, true], ['/admin/notifications', L('الإشعارات', 'Notifications'), Bell, true],
    ['/admin/staff', L('المستخدمون والصلاحيات', 'Staff & roles'), ShieldCheck, isAdmin], ['/admin/settings', L('الإعدادات', 'Settings'), Settings, isAdmin],
  ] as const;
  return (
    <div className="min-h-screen bg-sand-50" data-testid="admin-shell">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          <Logo settings={s} locale={locale} href="/admin" />
          <span className="badge bg-ink text-white">{L('لوحة التحكم', 'Dashboard')}</span>
          <div className="ms-auto flex items-center gap-2 text-sm">
            <span className="hidden text-ink/60 sm:inline">{user.email} · {roles.join(', ')}</span>
            <LangSwitch />
            <Link href="/" className="btn-ghost py-1.5">{L('المتجر', 'Store')}</Link>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="no-print sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-e border-sand-200 bg-white p-3 lg:block">
          {nav.filter((n) => n[3]).map(([href, label, Icon]) => (
            <Link key={href} href={href} className="mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/80 hover:bg-sand-100 hover:text-ink"><Icon className="h-4 w-4" />{label}</Link>
          ))}
        </aside>
        <div className="min-w-0 flex-1">
          <nav className="no-print flex gap-1 overflow-x-auto border-b border-sand-200 bg-white px-2 py-2 lg:hidden">
            {nav.filter((n) => n[3]).map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm hover:bg-sand-100">{label}</Link>)}
          </nav>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
