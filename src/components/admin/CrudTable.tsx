'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { errorText } from '@/lib/errors';

export type Field = {
  key: string; ar: string; en: string;
  type?: 'text' | 'number' | 'bool' | 'select' | 'datetime' | 'date' | 'time' | 'textarea' | 'array';
  options?: { value: string; ar: string; en: string }[]; required?: boolean; list?: boolean; nullable?: boolean; dir?: 'ltr'; readOnly?: boolean;
  help?: { ar: string; en: string };
};
type Row = Record<string, unknown>;

function toInput(f: Field, v: unknown): string | boolean {
  if (f.type === 'bool') return !!v;
  if (v === null || v === undefined) return '';
  if (f.type === 'datetime') return String(v).slice(0, 16);
  if (f.type === 'array') return (v as string[]).join('، ');
  if (f.type === 'time') return String(v).slice(0, 5);
  return String(v);
}
function fromInput(f: Field, v: string | boolean): unknown {
  if (f.type === 'bool') return !!v;
  if (v === '' || v === undefined) return f.type === 'array' ? [] : null;
  if (f.type === 'number') return Number(v);
  if (f.type === 'datetime') return new Date(String(v)).toISOString();
  if (f.type === 'array') return String(v).split(/[،,]/).map((s) => s.trim()).filter(Boolean);
  if (f.type === 'select' && f.nullable && v === '') return null;
  return v;
}

export function CrudTable({ table, rows, fields, pk = 'id', title, canDelete = true, canCreate = true, defaults = {} }: {
  table: string; rows: Row[]; fields: Field[]; pk?: string; title?: { ar: string; en: string }; canDelete?: boolean; canCreate?: boolean; defaults?: Row;
}) {
  const { locale, t } = useT();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const L = (o: { ar: string; en: string }) => (locale === 'ar' ? o.ar : o.en);
  const editingRow = rows.find((r) => String(r[pk]) === editing);

  function open(row: Row | null) {
    setErr(null);
    setEditing(row ? String(row[pk]) : 'new');
    setForm(Object.fromEntries(fields.map((f) => [f.key, toInput(f, row ? row[f.key] : defaults[f.key])])));
  }
  async function save() {
    setBusy(true); setErr(null);
    const payload: Row = Object.fromEntries(fields.filter((f) => !f.readOnly).map((f) => [f.key, fromInput(f, form[f.key])]));
    const sb = createClient();
    const { error } = editing === 'new' ? await sb.from(table).insert({ ...defaults, ...payload }) : await sb.from(table).update(payload).eq(pk, editing!);
    setBusy(false);
    if (error) return setErr(error.message.includes('violates') ? `${errorText(error, locale)} — ${error.message}` : errorText(error, locale));
    setEditing(null); router.refresh();
  }
  async function remove(id: string) {
    if (!confirm(locale === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
    const { error } = await createClient().from(table).delete().eq(pk, id);
    if (error) alert(errorText(error, locale)); else router.refresh();
  }
  const show = (f: Field, v: unknown) => {
    if (f.type === 'bool') return v ? '✓' : '—';
    if (f.type === 'select') { const o = f.options?.find((x) => x.value === v); return o ? L(o) : String(v ?? '—'); }
    if (f.type === 'datetime') return v ? new Date(String(v)).toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB') : '—';
    if (f.type === 'array') return (v as string[] || []).join('، ') || '—';
    return v === null || v === undefined || v === '' ? '—' : String(v);
  };

  const editor = (
    <div className="card space-y-3 border-brand" data-testid={`crud-editor-${table}`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => f.readOnly ? (
          <div key={f.key}><span className="label">{L(f)}</span><div className="rounded-xl bg-sand-100 px-3.5 py-2.5 text-sm">{show(f, editingRow?.[f.key])}</div></div>
        ) : (
          <label key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2 lg:col-span-3' : ''}>
            <span className="label">{L(f)}{f.required && ' *'}</span>
            {f.type === 'bool' ? (
              <input type="checkbox" name={f.key} className="h-5 w-5" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
            ) : f.type === 'select' ? (
              <select name={f.key} className="input" value={String(form[f.key] ?? '')} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                {f.nullable && <option value="">—</option>}
                {f.options?.map((o) => <option key={o.value} value={o.value}>{L(o)}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea name={f.key} className="input min-h-20" value={String(form[f.key] ?? '')} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            ) : (
              <input name={f.key} dir={f.dir} className="input" required={f.required}
                type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'}
                step={f.type === 'number' ? 'any' : undefined}
                value={String(form[f.key] ?? '')} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            )}
            {f.help && <span className="mt-1 block text-xs text-ink/50">{L(f.help)}</span>}
          </label>
        ))}
      </div>
      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
      <div className="flex gap-2"><button type="button" className="btn-primary" onClick={save} disabled={busy} data-testid="crud-save">{t.save}</button><button type="button" className="btn-ghost" onClick={() => setEditing(null)}>{t.cancel}</button></div>
    </div>
  );

  const listFields = fields.filter((f) => f.list !== false);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        {title && <h2 className="text-lg font-semibold">{L(title)}</h2>}
        {canCreate && editing !== 'new' && <button type="button" className="btn-primary py-2 text-sm" onClick={() => open(null)} data-testid={`crud-new-${table}`}>+ {locale === 'ar' ? 'إضافة' : 'Add'}</button>}
      </div>
      {editing === 'new' && editor}
      <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="table">
          <thead><tr>{listFields.map((f) => <th key={f.key}>{L(f)}</th>)}<th /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={listFields.length + 1} className="text-center text-ink/50">—</td></tr>}
            {rows.map((r) => (
              <tr key={String(r[pk])}>
                {listFields.map((f) => <td key={f.key} className="max-w-[240px] truncate">{show(f, r[f.key])}</td>)}
                <td className="whitespace-nowrap text-end">
                  <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => open(r)}>{t.edit}</button>
                  {canDelete && <button type="button" className="btn-ghost px-2 py-1 text-xs text-red-700" onClick={() => remove(String(r[pk]))}>{t.delete}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && editing !== 'new' && editor}
    </section>
  );
}
