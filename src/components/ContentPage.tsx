import { getSettings } from '@/lib/data';
import { getT } from '@/lib/i18n/server';
export async function ContentPage({ ar, en }: { ar: { title: string; body: React.ReactNode }; en: { title: string; body: React.ReactNode } }) {
  const { locale } = await getT();
  const s = await getSettings();
  const c = locale === 'ar' ? ar : en;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{c.title}</h1>
      <div className="prose-page mt-4">{c.body}</div>
      <p className="mt-10 text-xs text-ink/50">{locale === 'ar' ? `${s.store_name_ar} — يرجى من مالك المتجر مراجعة هذا النص واعتماده.` : `${s.store_name_en} — The store owner should review and approve this text.`}</p>
    </div>
  );
}
