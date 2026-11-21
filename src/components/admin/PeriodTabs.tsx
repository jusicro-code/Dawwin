'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n/client';
export function PeriodTabs({ active }: { active: string }) {
  const { locale } = useT(); const path = usePathname();
  const tabs = [['today', 'اليوم', 'Today'], ['week', 'أسبوع', 'Week'], ['month', 'شهر', 'Month'], ['year', 'سنة', 'Year'], ['all', 'الكل', 'All']];
  return <div className="flex rounded-xl border border-sand-200 bg-white p-1">{tabs.map(([k, ar, en]) => (
    <Link key={k} href={`${path}?p=${k}`} className={`rounded-lg px-3 py-1.5 text-sm ${active === k ? 'bg-brand text-white' : 'hover:bg-sand-100'}`}>{locale === 'ar' ? ar : en}</Link>
  ))}</div>;
}
