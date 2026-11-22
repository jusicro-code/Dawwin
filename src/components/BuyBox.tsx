'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n/client';
import { AddToCartButton } from './AddToCartButton';
import { Minus, Plus } from './icons';
type Animal = { id: string; tag_code: string; specifications: Record<string, unknown> };
export function BuyBox({ productId, max, soldOut, animals }: { productId: string; max: number; soldOut: boolean; animals: Animal[] }) {
  const { t } = useT();
  const [q, setQ] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <div className="space-y-4">
      {animals.length > 0 && (
        <div>
          <div className="label">{t.choose_animal}</div>
          <div className="flex flex-wrap gap-2">
            {animals.map((a) => (
              <button key={a.id} type="button" onClick={() => toggle(a.id)} className={`rounded-xl border px-3 py-2 text-sm ${sel.includes(a.id) ? 'border-brand bg-brand-soft text-brand' : 'border-sand-300 bg-white'}`}>
                {t.animal_tag}: {a.tag_code}
                {Object.entries(a.specifications || {}).slice(0, 2).map(([k, v]) => <span key={k} className="ms-1 text-xs text-ink/50">· {k}: {String(v)}</span>)}
              </button>
            ))}
          </div>
        </div>
      )}
      {sel.length === 0 && (
        <div className="flex items-center gap-3">
          <span className="label mb-0">{t.quantity}</span>
          <div className="inline-flex items-center rounded-xl border border-sand-300 bg-white">
            <button type="button" aria-label="-" onClick={() => setQ(Math.max(1, q - 1))} className="p-2.5"><Minus className="h-4 w-4" /></button>
            <input aria-label={t.quantity} data-testid="qty-input" value={q} inputMode="numeric" onChange={(e) => setQ(Math.max(1, Math.min(max || 1, parseInt(e.target.value) || 1)))} className="w-12 border-0 bg-transparent text-center font-semibold focus:outline-none" />
            <button type="button" aria-label="+" onClick={() => setQ(Math.min(max || 1, q + 1))} className="p-2.5"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      )}
      <AddToCartButton productId={productId} quantity={q} animalIds={sel} disabled={soldOut} />
    </div>
  );
}
