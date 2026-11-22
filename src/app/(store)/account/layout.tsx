import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login?next=/account');
  const { t } = await getT();
  const links = [['/account', t.profile], ['/account/orders', t.my_orders], ['/account/addresses', t.my_addresses], ['/account/favorites', t.my_favorites]];
  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-2xl font-bold md:text-3xl">{t.account_title}</h1>
      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex min-w-0 gap-2 overflow-x-auto md:flex-col">
          {links.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap rounded-xl px-3 py-2 text-sm hover:bg-sand-100">{l}</Link>)}
          <form action="/auth/signout" method="post"><button className="w-full whitespace-nowrap rounded-xl px-3 py-2 text-start text-sm text-red-700 hover:bg-red-50" data-testid="logout">{t.logout}</button></form>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
