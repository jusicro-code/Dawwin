'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { errorText } from '@/lib/errors';
export function StaffManager({ staff }: { staff: { user_id: string; email: string; full_name: string | null; roles: string[] }[] }) {
  const { locale } = useT(); const L = (ar: string, en: string) => (locale === 'ar' ? ar : en);
  const router = useRouter(); const sb = createClient();
  const [email, setEmail] = useState(''); const [role, setRole] = useState('staff'); const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60">{L('المالك/المدير: صلاحيات كاملة. الموظف: إدارة الطلبات والتوصيل فقط. يجب أن يكون المستخدم مسجلاً في المتجر أولاً.', 'Owner/admin: full access. Staff: orders & delivery only. The user must register on the store first.')}</p>
      <div className="card flex flex-wrap gap-2">
        <input className="input w-72" dir="ltr" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="input w-40" value={role} onChange={(e) => setRole(e.target.value)}><option value="staff">staff</option><option value="admin">admin</option><option value="owner">owner</option></select>
        <button className="btn-primary" onClick={async () => { const { error } = await sb.rpc('admin_grant_role', { p_email: email, p_role: role }); setMsg(error ? errorText(error, locale) : L('تم', 'Done')); if (!error) { setEmail(''); router.refresh(); } }}>{L('منح الصلاحية', 'Grant role')}</button>
        {msg && <span className="self-center text-sm">{msg}</span>}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white"><table className="table"><tbody>{staff.map((s) => (
        <tr key={s.user_id}><td>{s.full_name || '—'}<div className="text-xs text-ink/50" dir="ltr">{s.email}</div></td>
          <td>{s.roles.map((r) => <span key={r} className="badge me-1 bg-sand-100">{r} <button className="ms-1 text-red-700" aria-label="revoke" onClick={async () => { if (!confirm(L('سحب الصلاحية؟', 'Revoke role?'))) return; const { error } = await sb.rpc('admin_revoke_role', { p_user: s.user_id, p_role: r }); if (error) alert(errorText(error, locale)); router.refresh(); }}>×</button></span>)}</td></tr>
      ))}</tbody></table></div>
    </div>
  );
}
