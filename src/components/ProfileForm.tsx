'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/client';
import { updateProfile } from '@/app/actions/account';
export function ProfileForm({ initial }: { initial: { full_name: string; phone: string; preferred_language: string } }) {
  const { t } = useT(); const router = useRouter();
  const [v, setV] = useState(initial); const [msg, setMsg] = useState<string | null>(null);
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); const r = await updateProfile(v); setMsg(r.error || t.saved); router.refresh(); }}>
      <label><span className="label">{t.full_name}</span><input className="input" value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} /></label>
      <label><span className="label">{t.phone}</span><input className="input" dir="ltr" placeholder="05xxxxxxxx" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></label>
      <div className="flex items-center gap-3 sm:col-span-2"><button className="btn-primary">{t.save}</button>{msg && <span className="text-sm text-ink/70">{msg}</span>}</div>
    </form>
  );
}
