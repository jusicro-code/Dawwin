'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { errorText } from '@/lib/errors';
import { mediaUrl, type Media } from '@/lib/media';
import { Trash2, Upload } from '../icons';

type P = Record<string, unknown> & { id: string; inventory_mode: string; stock_quantity: number };
type Animal = { id: string; tag_code: string; status: string; specifications: Record<string, unknown>; notes: string | null; reserved_order_id: string | null };
const MAX_IMAGE = 10 * 1024 * 1024, MAX_VIDEO = 50 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function ProductEditor({ product, categories, media, animals, cost }: { product: P | null; categories: { id: string; name_ar: string; name_en: string }[]; media: (Media & { id: string })[]; animals: Animal[]; cost: number | null }) {
  const { locale, t } = useT();
  const L = (ar: string, en: string) => (locale === 'ar' ? ar : en);
  const router = useRouter();
  const sb = createClient();
  const [v, setV] = useState<Record<string, string | boolean>>(() => ({
    name_ar: '', name_en: '', slug: '', category_id: categories[0]?.id || '', description_ar: '', description_en: '', price: '', compare_at_price: '', wholesale_price: '',
    inventory_mode: 'quantity', low_stock_threshold: '3', is_hidden: false, is_featured: false, is_new_arrival: false, is_archived: false, sort_order: '10',
    ...(product ? Object.fromEntries(Object.entries(product).map(([k, x]) => [k, typeof x === 'boolean' ? x : x == null ? '' : String(x)])) : {}),
  }));
  const [costV, setCostV] = useState(cost == null ? '' : String(cost));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [delta, setDelta] = useState('');
  const [deltaNote, setDeltaNote] = useState('');
  const [tag, setTag] = useState(''); const [spec, setSpec] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const done = (error: unknown, ok: string) => { if (error) setMsg({ ok: false, text: errorText(error, locale) + ((error as { message?: string }).message ? ` (${(error as { message: string }).message})` : '') }); else { setMsg({ ok: true, text: ok }); router.refresh(); } };
  const num = (x: string | boolean) => (x === '' ? null : Number(x));

  async function save() {
    setBusy(true); setMsg(null);
    const row = {
      name_ar: String(v.name_ar).trim(), name_en: String(v.name_en).trim(), slug: String(v.slug).trim().toLowerCase(), category_id: v.category_id,
      description_ar: v.description_ar || null, description_en: v.description_en || null, price: Number(v.price), compare_at_price: num(v.compare_at_price),
      wholesale_price: num(v.wholesale_price), inventory_mode: v.inventory_mode, low_stock_threshold: Number(v.low_stock_threshold || 0),
      is_hidden: !!v.is_hidden, is_featured: !!v.is_featured, is_new_arrival: !!v.is_new_arrival, is_archived: !!v.is_archived, sort_order: Number(v.sort_order || 0),
    };
    if (!row.name_ar || !row.name_en || !/^[a-z0-9-]+$/.test(row.slug) || !(row.price > 0)) { setBusy(false); return setMsg({ ok: false, text: L('تحقق من الاسم والمعرف (حروف لاتينية صغيرة وأرقام و-) والسعر', 'Check names, slug (a-z, 0-9, -) and price') }); }
    const { data, error } = product ? await sb.from('products').update(row).eq('id', product.id).select('id').single() : await sb.from('products').insert(row).select('id').single();
    if (!error && data) {
      if (costV !== '') await sb.from('product_costs').upsert({ product_id: data.id, cost_price: Number(costV), updated_at: new Date().toISOString() });
      else if (product) await sb.from('product_costs').delete().eq('product_id', data.id);
    }
    setBusy(false);
    if (!product && data) { router.push(`/admin/products/${data.id}`); return; }
    done(error, t.saved);
  }

  async function upload(files: FileList | null) {
    if (!files || !product) return;
    setBusy(true); setMsg(null);
    for (const f of Array.from(files)) {
      const isVideo = VIDEO_TYPES.includes(f.type);
      if (!IMAGE_TYPES.includes(f.type) && !isVideo) { setMsg({ ok: false, text: L('نوع الملف غير مدعوم', 'Unsupported file type') }); continue; }
      if (f.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) { setMsg({ ok: false, text: L('حجم الملف كبير', 'File too large') }); continue; }
      const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
      const path = `products/${product.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await sb.storage.from('product-media').upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) { setMsg({ ok: false, text: upErr.message }); continue; }
      await sb.from('product_images').insert({ product_id: product.id, media_type: isVideo ? 'video' : 'image', storage_path: path, alt_ar: String(v.name_ar), alt_en: String(v.name_en), sort_order: media.length + 1 });
    }
    // Once real photos exist, remove demonstration placeholders automatically.
    await sb.from('product_images').delete().eq('product_id', product.id).eq('is_placeholder', true);
    setBusy(false); router.refresh();
  }
  async function removeMedia(m: Media & { id: string }) {
    if (!confirm(L('حذف الملف؟', 'Delete file?'))) return;
    if (m.storage_path && !m.storage_path.startsWith('placeholder:')) await sb.storage.from('product-media').remove([m.storage_path]);
    const { error } = await sb.from('product_images').delete().eq('id', m.id);
    done(error, t.saved);
  }
  async function makeCover(m: Media & { id: string }) {
    await Promise.all(media.map((x, i) => sb.from('product_images').update({ sort_order: x.id === m.id ? 0 : i + 1 }).eq('id', x.id)));
    router.refresh();
  }

  const field = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label><span className="label">{label}</span><input name={k} className="input" value={String(v[k] ?? '')} onChange={set(k)} {...props} /></label>
  );
  const check = (k: string, label: string) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={k} checked={!!v[k]} onChange={(e) => setV({ ...v, [k]: e.target.checked })} />{label}</label>;

  return (
    <div className="space-y-6" data-testid="product-editor">
      <h1 className="text-2xl font-bold">{product ? String(locale === 'ar' ? v.name_ar : v.name_en) : L('منتج جديد', 'New product')}</h1>
      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`} role="status" data-testid="admin-msg">{msg.text}</p>}
      <section className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field('name_ar', L('الاسم بالعربية', 'Arabic name'), { required: true })}
          {field('name_en', L('الاسم بالإنجليزية', 'English name'), { required: true })}
          {field('slug', L('المعرف في الرابط', 'URL slug'), { dir: 'ltr', required: true })}
          <label><span className="label">{L('القسم', 'Category')}</span><select className="input" value={String(v.category_id)} onChange={set('category_id')}>{categories.map((c) => <option key={c.id} value={c.id}>{locale === 'ar' ? c.name_ar : c.name_en}</option>)}</select></label>
          {field('price', L('السعر (ر.س)', 'Price (SAR)'), { type: 'number', step: '0.01', min: '0.01', required: true })}
          {field('compare_at_price', L('السعر السابق (لخصم حقيقي فقط)', 'Previous price (genuine discount only)'), { type: 'number', step: '0.01' })}
          {field('wholesale_price', L('سعر الجملة', 'Wholesale price'), { type: 'number', step: '0.01' })}
          <label><span className="label">{L('تكلفة الرأس (داخلي)', 'Unit cost (internal)')}</span><input className="input" type="number" step="0.01" value={costV} onChange={(e) => setCostV(e.target.value)} /></label>
          <label><span className="label">{L('نوع المخزون', 'Inventory model')}</span><select className="input" value={String(v.inventory_mode)} onChange={set('inventory_mode')}><option value="quantity">{L('بالكمية', 'Quantity-based')}</option><option value="individual">{L('رؤوس مرقمة', 'Individually identified')}</option></select></label>
          {field('low_stock_threshold', L('حد التنبيه للمخزون', 'Low-stock threshold'), { type: 'number', min: '0' })}
          {field('sort_order', L('الترتيب', 'Sort order'), { type: 'number' })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">{L('الوصف بالعربية', 'Arabic description')}</span><textarea className="input min-h-28" value={String(v.description_ar)} onChange={set('description_ar')} /></label>
          <label><span className="label">{L('الوصف بالإنجليزية', 'English description')}</span><textarea className="input min-h-28" value={String(v.description_en)} onChange={set('description_en')} /></label>
        </div>
        <div className="flex flex-wrap gap-5">{check('is_featured', L('مميز', 'Featured'))}{check('is_new_arrival', L('وصل حديثاً', 'New arrival'))}{check('is_hidden', L('مخفي', 'Hidden'))}{check('is_archived', L('مؤرشف', 'Archived'))}</div>
        <button className="btn-primary" disabled={busy} onClick={save} data-testid="save-product">{t.save}</button>
      </section>

      {product && (
        <section className="card space-y-4">
          <h2 className="font-semibold">{L('الصور والفيديو', 'Photos & videos')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {media.map((m, i) => (
              <div key={m.id} className="relative overflow-hidden rounded-xl border border-sand-200">
                {m.media_type === 'video' ? <video src={mediaUrl(m)} className="aspect-square w-full bg-black object-cover" muted />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={mediaUrl(m)} alt="" className="aspect-square w-full object-cover" />}
                {m.is_placeholder && <span className="absolute start-1 top-1 rounded bg-ink/70 px-1.5 text-[10px] text-white">{L('توضيحية', 'Demo')}</span>}
                <div className="absolute inset-x-1 bottom-1 flex justify-between">
                  {i > 0 ? <button className="rounded bg-white/90 px-1.5 text-[11px]" onClick={() => makeCover(m)}>{L('رئيسية', 'Cover')}</button> : <span />}
                  <button aria-label="delete" className="rounded bg-white/90 p-1 text-red-700" onClick={() => removeMedia(m)}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <label className="btn-outline cursor-pointer">
            <Upload className="h-4 w-4" />{L('رفع صور أو فيديو (JPG/PNG/WebP حتى 10MB، MP4/WebM حتى 50MB)', 'Upload images or video (JPG/PNG/WebP ≤10MB, MP4/WebM ≤50MB)')}
            <input type="file" className="sr-only" multiple accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(',')} onChange={(e) => upload(e.target.files)} data-testid="media-upload" />
          </label>
        </section>
      )}

      {product && product.inventory_mode === 'quantity' && (
        <section className="card space-y-3">
          <h2 className="font-semibold">{L('المخزون', 'Stock')}: <span data-testid="stock-value">{product.stock_quantity}</span></h2>
          <div className="flex flex-wrap gap-2">
            <input className="input w-32" type="number" placeholder="+5 / -2" value={delta} onChange={(e) => setDelta(e.target.value)} aria-label="delta" />
            <input className="input w-64" placeholder={L('سبب التعديل', 'Reason')} value={deltaNote} onChange={(e) => setDeltaNote(e.target.value)} />
            <button className="btn-outline" disabled={busy || !Number(delta)} data-testid="adjust-stock" onClick={async () => { const { error } = await sb.rpc('admin_adjust_stock', { p_product: product.id, p_delta: Number(delta), p_note: deltaNote || null }); setDelta(''); done(error, t.saved); }}>{L('تعديل المخزون', 'Adjust stock')}</button>
          </div>
        </section>
      )}

      {product && product.inventory_mode === 'individual' && (
        <section className="card space-y-3">
          <h2 className="font-semibold">{L('سجلات الرؤوس', 'Animal records')} ({animals.filter((a) => a.status === 'available').length} {L('متاح', 'available')})</h2>
          <div className="flex flex-wrap gap-2">
            <input className="input w-40" dir="ltr" placeholder={L('رقم الرأس', 'Animal ID')} value={tag} onChange={(e) => setTag(e.target.value)} />
            <input className="input w-80" placeholder={L('مواصفات: العمر=8 أشهر، اللون=أبيض', 'Specs: age=8 months, color=white')} value={spec} onChange={(e) => setSpec(e.target.value)} />
            <button className="btn-outline" disabled={!tag.trim()} onClick={async () => {
              const specs = Object.fromEntries(spec.split(/[،,]/).map((s) => s.split('=').map((x) => x.trim())).filter((x) => x.length === 2 && x[0]));
              const { error } = await sb.from('animals').insert({ product_id: product.id, tag_code: tag.trim(), specifications: specs });
              if (!error) { setTag(''); setSpec(''); } done(error, t.saved);
            }}>{L('إضافة رأس', 'Add animal')}</button>
          </div>
          <table className="table text-sm"><thead><tr><th>{L('الرقم', 'ID')}</th><th>{L('المواصفات', 'Specs')}</th><th>{L('الحالة', 'Status')}</th><th /></tr></thead>
            <tbody>{animals.map((a) => (
              <tr key={a.id}><td dir="ltr">{a.tag_code}</td><td className="text-xs">{Object.entries(a.specifications || {}).map(([k, x]) => `${k}: ${x}`).join(' · ')}</td>
                <td>{a.status === 'reserved' || a.status === 'sold' ? <span className="badge bg-sand-100">{a.status}</span> : (
                  <select className="input py-1 text-xs" value={a.status} onChange={async (e) => { const { error } = await sb.from('animals').update({ status: e.target.value }).eq('id', a.id); done(error, t.saved); }}>
                    <option value="available">available</option><option value="unavailable">unavailable</option>
                  </select>)}</td>
                <td>{a.status !== 'reserved' && a.status !== 'sold' && <button className="text-red-700" aria-label="delete" onClick={async () => { const { error } = await sb.from('animals').delete().eq('id', a.id); done(error, t.saved); }}><Trash2 className="h-4 w-4" /></button>}</td></tr>
            ))}</tbody></table>
        </section>
      )}
    </div>
  );
}
