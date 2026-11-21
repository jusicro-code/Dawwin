'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useT } from '@/lib/i18n/client';
import { Globe } from './icons';
export function LangSwitch({ className = '' }: { className?: string }) {
  const { locale, t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button" data-testid="lang-switch" disabled={pending}
      onClick={() => start(() => {
        document.cookie = `lang=${locale === 'ar' ? 'en' : 'ar'}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      })}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-sand-100 ${className}`}
    >
      <Globe className="h-4 w-4" />{t.lang_switch}
    </button>
  );
}
