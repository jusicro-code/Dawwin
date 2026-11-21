import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { dateFmt } from '@/lib/format';
import { ProfileForm } from '@/components/ProfileForm';
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  const { locale, t } = await getT();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const [{ data: profile }, { data: notes }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user!.id).single(),
    sb.from('notifications').select('*').eq('user_id', user!.id).eq('channel', 'in_app').order('created_at', { ascending: false }).limit(15),
  ]);
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-4 font-semibold">{t.profile}</h2>
        <p className="mb-4 text-sm text-ink/60" dir="ltr">{user!.email}</p>
        <ProfileForm initial={{ full_name: profile?.full_name || '', phone: profile?.phone ? '0' + profile.phone.slice(4) : '', preferred_language: profile?.preferred_language || 'ar' }} />
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">{t.notifications}</h2>
        {(notes || []).length === 0 ? <p className="text-sm text-ink/60">—</p> : (
          <ul className="space-y-2 text-sm">{notes!.map((n) => (
            <li key={n.id} className="flex justify-between gap-3 border-b border-sand-100 pb-2">
              <span><b>{locale === 'ar' ? n.title_ar : n.title_en}</b> — {locale === 'ar' ? n.body_ar : n.body_en}</span>
              <span className="shrink-0 text-ink/50">{dateFmt(n.created_at, locale, true)}</span>
            </li>))}</ul>
        )}
      </div>
    </div>
  );
}
