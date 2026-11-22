'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/client';
import { deleteAddress } from '@/app/actions/checkout';
import { AddressForm, type Zone } from './AddressForm';
type A = { id: string; label: string | null; recipient_name: string; recipient_phone: string; zone_id: string; city: string; neighborhood: string; street: string | null; building_details: string | null; national_address_short_code: string | null; delivery_instructions: string | null; is_default: boolean; latitude: number | null; longitude: number | null };
export function AddressBook({ addresses, zones }: { addresses: A[]; zones: Zone[] }) {
  const { t } = useT(); const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {addresses.length === 0 && editing !== 'new' && <div className="card text-ink/60">{t.no_addresses}</div>}
      {addresses.map((a) => editing === a.id ? (
        <AddressForm key={a.id} zones={zones} initial={{ ...a, recipient_phone: '0' + a.recipient_phone.slice(4) }} onSaved={() => { setEditing(null); router.refresh(); }} onCancel={() => setEditing(null)} />
      ) : (
        <div key={a.id} className="card flex flex-wrap items-start justify-between gap-3 text-sm">
          <div>
            <div className="font-semibold">{a.label || a.recipient_name} {a.is_default && <span className="badge ms-1 bg-brand-soft text-brand">{t.set_default}</span>}</div>
            <div className="text-ink/70">{[a.city, a.neighborhood, a.street, a.building_details].filter(Boolean).join('، ')}</div>
            <div className="text-ink/50" dir="ltr">{a.recipient_phone}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline py-1.5 text-xs" onClick={() => setEditing(a.id)}>{t.edit}</button>
            <button className="btn-ghost py-1.5 text-xs text-red-700" onClick={async () => { await deleteAddress(a.id); router.refresh(); }}>{t.delete}</button>
          </div>
        </div>
      ))}
      {editing === 'new' ? <AddressForm zones={zones} onSaved={() => { setEditing(null); router.refresh(); }} onCancel={() => setEditing(null)} />
        : <button className="btn-primary" onClick={() => setEditing('new')}>+ {t.add_address}</button>}
    </div>
  );
}
