'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/client';
import { errorText } from '@/lib/errors';
import { statusLabel } from '@/lib/status';
import { money, normalizeSaPhone, dateFmt } from '@/lib/format';

type Props = {
  order: { id: string; status: string; payment_method: string; payment_status: string; total: number; refunded: number; hasInvoice: boolean };
  next: string[]; personnel: { id: string; full_name: string; phone: string }[];
  assignment: { personnel_id: string | null; driver_name: string; driver_phone: string } | null;
  notes: { id: string; note: string; created_at: string }[]; isAdmin: boolean;
};

export function OrderActions({ order, next, personnel, assignment, notes, isAdmin }: Props) {
  const { locale } = useT();
  const L = (ar: string, en: string) => (locale === 'ar' ? ar : en);
  const router = useRouter();
  const sb = createClient();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [driver, setDriver] = useState(assignment?.personnel_id || '');
  const [dName, setDName] = useState(assignment?.personnel_id ? '' : assignment?.driver_name || '');
  const [dPhone, setDPhone] = useState('');
  const refundable = Math.max(0, order.total - order.refunded);
  const [rAmount, setRAmount] = useState(String(refundable));
  const [rReason, setRReason] = useState('');
  const [rRestock, setRRestock] = useState(order.status !== 'delivered');

  async function run(fn: () => Promise<{ error: unknown } | { error?: string }>, ok: string) {
    setBusy(true); setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.error) setMsg({ ok: false, text: typeof r.error === 'string' ? r.error : errorText(r.error, locale) });
    else { setMsg({ ok: true, text: ok }); router.refresh(); }
  }
  const setStatus = (s: string) => {
    if (s === 'cancelled' && !confirm(L('تأكيد إلغاء/رفض الطلب؟ سيتم إرجاع المخزون.', 'Cancel/reject this order? Stock will be released.'))) return;
    return run(() => sb.rpc('admin_set_order_status', { p_order: order.id, p_status: s, p_note: statusNote || null }), L('تم تحديث الحالة', 'Status updated'));
  };
  const awaitingOnline = order.status === 'awaiting_payment' && order.payment_method !== 'cod' && !['paid', 'authorized'].includes(order.payment_status);

  return (
    <div className="space-y-6">
      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`} role="status" data-testid="admin-msg">{msg.text}</p>}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <section className="card space-y-3">
          <h2 className="font-semibold">{L('تحديث حالة الطلب', 'Update order status')}</h2>
          {awaitingOnline && <p className="text-sm text-amber-800">{L('لم يتم التحقق من الدفع الإلكتروني بعد — لا يمكن تأكيد الطلب.', 'Online payment not verified yet — order cannot be confirmed.')}</p>}
          <input className="input" placeholder={L('ملاحظة (تظهر في السجل / سبب الرفض)', 'Note (shown in history / rejection reason)')} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {!awaitingOnline && next.map((s) => (
              <button key={s} disabled={busy} className="btn-primary py-2 text-sm" data-testid={`status-${s}`} onClick={() => setStatus(s)}>
                {order.status === 'awaiting_payment' && s === 'confirmed' ? L('تأكيد الطلب', 'Confirm order') : statusLabel(s, locale)}
              </button>
            ))}
            {order.status !== 'delivered' && <button disabled={busy} className="btn-danger py-2 text-sm" data-testid="status-cancelled" onClick={() => setStatus('cancelled')}>{order.status === 'awaiting_payment' ? L('رفض الطلب', 'Reject order') : L('إلغاء الطلب', 'Cancel order')}</button>}
          </div>
        </section>
      )}

      {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
        <section className="card space-y-3">
          <h2 className="font-semibold">{L('إسناد مندوب التوصيل', 'Assign delivery driver')}</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <select className="input" value={driver} onChange={(e) => setDriver(e.target.value)} aria-label="driver">
              <option value="">{L('— إدخال يدوي —', '— Manual entry —')}</option>
              {personnel.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.phone})</option>)}
            </select>
            {!driver && <><input className="input" placeholder={L('اسم المندوب', 'Driver name')} value={dName} onChange={(e) => setDName(e.target.value)} /><input className="input" dir="ltr" placeholder="05xxxxxxxx" value={dPhone} onChange={(e) => setDPhone(e.target.value)} /></>}
          </div>
          <button disabled={busy} className="btn-outline" onClick={() => {
            const phone = driver ? null : normalizeSaPhone(dPhone);
            if (!driver && (!dName || !phone)) return setMsg({ ok: false, text: errorText('INVALID_PHONE', locale) });
            run(() => sb.rpc('admin_assign_delivery', { p_order: order.id, p_personnel: driver || null, p_name: dName || null, p_phone: phone }), L('تم الإسناد', 'Assigned'));
          }}>{L('حفظ الإسناد', 'Save assignment')}</button>
        </section>
      )}

      <section className="card space-y-3">
        <h2 className="font-semibold">{L('ملاحظات داخلية', 'Internal notes')}</h2>
        <ul className="space-y-1 text-sm">{notes.map((n) => <li key={n.id} className="rounded-lg bg-sand-50 p-2">{n.note} <span className="text-xs text-ink/50">· {dateFmt(n.created_at, locale, true)}</span></li>)}</ul>
        <div className="flex gap-2">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={L('أضف ملاحظة لا يراها العميل', 'Add a note (not visible to customer)')} />
          <button disabled={busy || !note.trim()} className="btn-outline" onClick={async () => {
            const { data: { user } } = await sb.auth.getUser();
            await run(() => sb.from('order_internal_notes').insert({ order_id: order.id, note: note.trim(), author_id: user?.id }), L('تمت الإضافة', 'Added'));
            setNote('');
          }}>{L('إضافة', 'Add')}</button>
        </div>
      </section>

      {isAdmin && ['paid', 'partially_refunded'].includes(order.payment_status) && (
        <section className="card space-y-3">
          <h2 className="font-semibold">{L('استرداد المبلغ', 'Refund')}</h2>
          <p className="text-xs text-ink/60">{order.payment_method === 'cod'
            ? L('الدفع عند الاستلام: يُسجّل الاسترداد يدوياً (نقداً/تحويل).', 'Cash on delivery: refund is recorded manually (cash/transfer).')
            : L('سيتم تنفيذ الاسترداد لدى مزود الدفع أولاً، ثم تسجيله وإصدار إشعار دائن.', 'Refund is executed with the payment provider first, then recorded with a credit note.')}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="input" type="number" step="0.01" max={refundable} value={rAmount} onChange={(e) => setRAmount(e.target.value)} aria-label="amount" />
            <input className="input sm:col-span-2" placeholder={L('سبب الاسترداد', 'Reason')} value={rReason} onChange={(e) => setRReason(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rRestock} onChange={(e) => setRRestock(e.target.checked)} />{L('إرجاع الكمية للمخزون', 'Return quantity to stock')}</label>
          <button disabled={busy} className="btn-danger" data-testid="refund-btn" onClick={() => {
            if (!confirm(L(`تأكيد استرداد ${money(Number(rAmount), locale)}؟`, `Refund ${money(Number(rAmount), locale)}?`))) return;
            run(async () => {
              const r = await fetch('/api/admin/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: order.id, amount: Number(rAmount), reason: rReason, restock: rRestock }) });
              const j = await r.json();
              return { error: r.ok ? undefined : j.error };
            }, L('تم تسجيل الاسترداد وإصدار إشعار دائن', 'Refund recorded and credit note issued'));
          }}>{L('تنفيذ الاسترداد', 'Issue refund')}</button>
        </section>
      )}

      {!order.hasInvoice && ['paid', 'partially_refunded'].includes(order.payment_status) && (
        <button className="btn-outline" disabled={busy} onClick={() => run(() => sb.rpc('admin_issue_invoice', { p_order: order.id }), L('تم إصدار الفاتورة', 'Invoice issued'))}>{L('إصدار الفاتورة', 'Issue invoice')}</button>
      )}
    </div>
  );
}
