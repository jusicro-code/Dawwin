'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { mediaUrl } from '@/lib/media';
import { optimizeImage } from '@/lib/compress';
export function CategoryImages({ categories }: { categories: { id: string; name: string; image_path: string | null; image_credit: string | null }[] }) {
  const { locale } = useT(); const L = (ar: string, en: string) => (locale === 'ar' ? ar : en);
  const router = useRouter(); const sb = createClient();
  const [busy, setBusy] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null);
  async function upload(id: string, file?: File) {
    if (!file) return; setBusy(id); setErr(null);
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 15 * 1024 * 1024) { setBusy(null); return setErr(L('صورة JPG/PNG/WebP حتى 15MB', 'JPG/PNG/WebP image up to 15MB')); }
    const f = await optimizeImage(file, 2400);
    const path = `categories/${id}/${crypto.randomUUID()}.${f.type === 'image/webp' ? 'webp' : (f.name.split('.').pop() || 'jpg')}`;
    const { error } = await sb.storage.from('product-media').upload(path, f, { contentType: f.type });
    if (!error) await sb.from('categories').update({ image_path: path }).eq('id', id);
    setBusy(null); if (error) setErr(error.message); else router.refresh();
  }
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">{L('صور الأقسام (صور حقيقية فقط)', 'Category photos (real photos only)')}</h2>
      <p className="text-xs text-ink/60">{L('استخدم صورك الحقيقية أو صوراً مرخّصة تجارياً. أضف نص حقوق الصورة إن كانت مرخّصة من طرف آخر.', 'Use your own photos or commercially licensed photos. Add a credit line when the photo is licensed from a third party.')}</p>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="space-y-2 rounded-xl border border-sand-200 p-3">
            <div className="font-medium">{c.name}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.image_path ? <img src={mediaUrl({ storage_path: c.image_path, external_url: null })} alt="" className="aspect-[16/7] w-full rounded-lg object-cover" /> : <div className="flex aspect-[16/7] items-center justify-center rounded-lg bg-sand-100 text-xs text-ink/50">{L('لا توجد صورة', 'No photo')}</div>}
            <label className="btn-outline w-full cursor-pointer text-sm">{busy === c.id ? '…' : L('رفع صورة', 'Upload photo')}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(c.id, e.target.files?.[0])} /></label>
            <input className="input text-xs" placeholder={L('حقوق الصورة (اختياري)', 'Photo credit (optional)')} defaultValue={c.image_credit || ''} onBlur={async (e) => { await sb.from('categories').update({ image_credit: e.target.value || null }).eq('id', c.id); router.refresh(); }} />
            {c.image_path && <button className="text-xs text-red-700" onClick={async () => { await sb.from('categories').update({ image_path: null }).eq('id', c.id); router.refresh(); }}>{L('إزالة الصورة', 'Remove photo')}</button>}
          </div>
        ))}
      </div>
    </section>
  );
}
