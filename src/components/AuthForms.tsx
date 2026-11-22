'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { GOOGLE_AUTH_ENABLED } from '@/lib/env';
import { normalizeSaPhone } from '@/lib/format';
import { codeText } from '@/lib/errors';

function useNext() { const n = useSearchParams().get('next') || '/account'; return n.startsWith('/') && !n.startsWith('//') ? n : '/account'; }
function authErr(msg: string, ar: boolean) {
  if (/Invalid login credentials/i.test(msg)) return ar ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password';
  if (/Email not confirmed/i.test(msg)) return ar ? 'يرجى تأكيد بريدك الإلكتروني أولاً' : 'Please confirm your email first';
  if (/already registered/i.test(msg)) return ar ? 'البريد مسجل مسبقاً' : 'Email already registered';
  if (/Password should be/i.test(msg)) return ar ? 'كلمة المرور قصيرة (8 أحرف على الأقل)' : 'Password too short (min 8 characters)';
  if (/rate limit/i.test(msg)) return ar ? 'محاولات كثيرة، حاول لاحقاً' : 'Too many attempts, try later';
  return msg;
}
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card space-y-4 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-160.png" alt="" className="mx-auto h-20 w-20 rounded-2xl bg-sand-50 ring-1 ring-gold/40" />
        <h1 className="text-center text-2xl font-bold text-brand">{title}</h1>{children}
      </div>
    </div>
  );
}
function GoogleButton({ next }: { next: string }) {
  const { t } = useT();
  if (!GOOGLE_AUTH_ENABLED) return null;
  return (
    <button type="button" className="btn-outline w-full py-3" onClick={() => createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } })}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/></svg>
      {t.google}
    </button>
  );
}

export function LoginForm() {
  const { t, locale } = useT(); const router = useRouter(); const next = useNext();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr(authErr(error.message, locale === 'ar'));
    router.replace(next); router.refresh();
  }
  return (
    <Shell title={t.login_title}>
      <form onSubmit={submit} className="space-y-4" data-testid="login-form">
        <label className="block"><span className="label">{t.email}</span><input type="email" name="email" required dir="ltr" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block"><span className="label">{t.password}</span><input type="password" name="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>{t.login_title}</button>
      </form>
      <GoogleButton next={next} />
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand hover:underline">{t.forgot}</Link>
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-brand hover:underline">{t.register_title}</Link>
      </div>
    </Shell>
  );
}

export function RegisterForm() {
  const { t, locale } = useT(); const router = useRouter(); const next = useNext();
  const [v, setV] = useState({ name: '', phone: '', email: '', password: '' });
  const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    const phone = v.phone ? normalizeSaPhone(v.phone) : null;
    if (v.phone && !phone) return setErr(codeText('INVALID_PHONE', locale));
    if (v.password.length < 8) return setErr(authErr('Password should be', locale === 'ar'));
    setBusy(true);
    const { data, error } = await createClient().auth.signUp({
      email: v.email.trim(), password: v.password,
      options: { data: { full_name: v.name.trim(), phone, lang: locale }, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) return setErr(authErr(error.message, locale === 'ar'));
    if (data.session) { router.replace(next); router.refresh(); } else setOk(true);
  }
  return (
    <Shell title={t.register_title}>
      {ok ? <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" data-testid="register-ok">{t.check_email}</p> : (
        <form onSubmit={submit} className="space-y-4" data-testid="register-form">
          <label className="block"><span className="label">{t.full_name}</span><input name="full_name" required className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></label>
          <label className="block"><span className="label">{t.phone}</span><input name="phone" dir="ltr" placeholder="05xxxxxxxx" inputMode="tel" className="input" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></label>
          <label className="block"><span className="label">{t.email}</span><input type="email" name="email" required dir="ltr" className="input" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></label>
          <label className="block"><span className="label">{t.password}</span><input type="password" name="password" required minLength={8} autoComplete="new-password" className="input" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></label>
          {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
          <button className="btn-primary w-full py-3" disabled={busy}>{t.register_title}</button>
        </form>
      )}
      <GoogleButton next={next} />
      <p className="text-sm">{t.have_account} <Link href="/login" className="text-brand hover:underline">{t.login_title}</Link></p>
    </Shell>
  );
}

export function ForgotForm() {
  const { t } = useT(); const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
    setSent(true);
  }
  return (
    <Shell title={t.reset_title}>
      {sent ? <p className="text-sm text-ink/70">{t.reset_sent}</p> : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="label">{t.email}</span><input type="email" required dir="ltr" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="btn-primary w-full py-3">{t.reset_send}</button>
        </form>
      )}
    </Shell>
  );
}

export function ResetForm() {
  const { t, locale } = useT(); const router = useRouter();
  const [pw, setPw] = useState(''); const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) return setErr(authErr(error.message, locale === 'ar'));
    router.replace('/account');
  }
  return (
    <Shell title={t.update_password}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="label">{t.new_password}</span><input type="password" required minLength={8} className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary w-full py-3">{t.update_password}</button>
      </form>
    </Shell>
  );
}
