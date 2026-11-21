import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { dateFmt } from '@/lib/format';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';
const n2 = (v: number) => Number(v).toFixed(2);

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: inv } = await sb.from('invoices').select('*, invoice_items(*), orders(order_number), original:original_invoice_id(invoice_number)').eq('id', id).maybeSingle();
  if (!inv) notFound();
  const seller = inv.seller_snapshot || {}; const buyer = inv.buyer_snapshot || {};
  const qr = inv.qr_payload ? await QRCode.toDataURL(inv.qr_payload, { margin: 1, width: 160 }) : null;
  const isCredit = inv.invoice_type === 'credit_note';
  const vatApplies = Number(inv.vat_amount) > 0;
  const title = isCredit ? ['إشعار دائن', 'Credit Note'] : vatApplies && seller.vat_number ? ['فاتورة ضريبية مبسطة', 'Simplified Tax Invoice'] : ['فاتورة', 'Invoice'];
  return (
    <div dir="rtl" className="mx-auto max-w-3xl bg-white p-6 text-sm text-ink print:p-0">
      <div className="no-print mb-4 flex justify-end"><PrintButton /></div>
      <header className="flex items-start justify-between gap-6 border-b border-sand-200 pb-4">
        <div>
          <h1 className="text-xl font-bold">{title[0]} <span className="text-base font-normal text-ink/60">/ {title[1]}</span></h1>
          <div className="mt-1">رقم الفاتورة / No.: <b dir="ltr">{inv.invoice_number}</b></div>
          <div>التاريخ / Date: {dateFmt(inv.issued_at, 'ar', true)}</div>
          <div>رقم الطلب / Order: <span dir="ltr">{inv.orders?.order_number}</span></div>
          {isCredit && inv.original && <div>مرجع الفاتورة الأصلية / Ref: <span dir="ltr">{inv.original.invoice_number}</span></div>}
        </div>
        {qr && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="ZATCA QR" className="h-32 w-32" />)}
      </header>
      <section className="grid grid-cols-2 gap-6 border-b border-sand-200 py-4">
        <div>
          <div className="mb-1 font-semibold">البائع / Seller</div>
          <div>{seller.legal_name_ar || seller.name_ar}</div>
          {(seller.legal_name_en || seller.name_en) && <div dir="ltr" className="text-start">{seller.legal_name_en || seller.name_en}</div>}
          {seller.cr_number && <div>السجل التجاري / CR: {seller.cr_number}</div>}
          {seller.vat_number && <div>الرقم الضريبي / VAT No: {seller.vat_number}</div>}
          {seller.address_ar && <div>{seller.address_ar}</div>}
          {seller.vat_exempt && <div className="mt-1 text-xs text-ink/60">معفى من الضريبة / VAT exempt{seller.vat_exemption_reason ? `: ${seller.vat_exemption_reason}` : ''}</div>}
        </div>
        <div>
          <div className="mb-1 font-semibold">المشتري / Buyer</div>
          <div>{buyer.name}</div>
          <div dir="ltr" className="text-end">{buyer.phone}</div>
          {buyer.email && <div dir="ltr" className="text-end">{buyer.email}</div>}
          <div>{[buyer.address?.city, buyer.address?.neighborhood, buyer.address?.street].filter(Boolean).join('، ')}</div>
        </div>
      </section>
      <table className="table mt-4">
        <thead><tr><th>الوصف / Description</th><th>الكمية / Qty</th><th>سعر الوحدة / Unit</th><th>الخصم / Disc.</th><th>الخاضع / Taxable</th><th>الضريبة / VAT</th><th>الإجمالي / Total</th></tr></thead>
        <tbody>
          {inv.invoice_items.map((it: { id: string; description_ar: string; description_en: string | null; quantity: number; unit_price: number; discount: number; taxable_amount: number; vat_amount: number; line_total: number }) => (
            <tr key={it.id}><td>{it.description_ar}{it.description_en && <div className="text-xs text-ink/50">{it.description_en}</div>}</td><td>{Number(it.quantity)}</td><td>{n2(it.unit_price)}</td><td>{n2(it.discount)}</td><td>{n2(it.taxable_amount)}</td><td>{n2(it.vat_amount)}</td><td>{n2(it.line_total)}</td></tr>
          ))}
        </tbody>
      </table>
      <section className="ms-auto mt-4 w-full max-w-xs space-y-1">
        {!isCredit && <Row k="المجموع / Subtotal" v={n2(inv.subtotal)} />}
        {!isCredit && Number(inv.discount_total) > 0 && <Row k="الخصومات / Discounts" v={'-' + n2(inv.discount_total)} />}
        {!isCredit && Number(inv.delivery_fee) > 0 && <Row k="التوصيل / Delivery" v={n2(inv.delivery_fee)} />}
        <Row k="الإجمالي الخاضع للضريبة / Taxable" v={n2(inv.taxable_amount)} />
        <Row k={`ضريبة القيمة المضافة / VAT ${inv.vat_rate ? Number(inv.vat_rate) + '%' : ''}`} v={n2(inv.vat_amount)} />
        <div className="flex justify-between border-t border-ink pt-2 text-base font-bold"><span>الإجمالي / Total (SAR)</span><span>{n2(inv.total)}</span></div>
      </section>
      <footer className="mt-8 border-t border-sand-200 pt-3 text-xs text-ink/50">
        {inv.reason && <div>السبب / Reason: {inv.reason}</div>}
        <div>العملة: ريال سعودي / Currency: SAR · UUID: <span dir="ltr">{inv.invoice_uuid}</span></div>
        <div>حالة الربط مع فاتورة (زاتكا) / ZATCA status: {inv.zatca_status}</div>
      </footer>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between"><span className="text-ink/70">{k}</span><span>{v}</span></div>; }
