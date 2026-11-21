import { NextResponse, type NextRequest } from 'next/server';
import { verifyTabbyPayment } from '@/lib/payments/tabby';
export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get('order') || '';
  const paymentId = req.nextUrl.searchParams.get('payment_id') || '';
  if (!/^[0-9a-f-]{36}$/.test(order)) return NextResponse.redirect(new URL('/', req.url));
  try {
    const r = paymentId ? await verifyTabbyPayment(paymentId) : { result: 'pending', orderId: order };
    const ok = r.orderId === order && ['paid', 'already_paid', 'authorized'].includes(r.result);
    return NextResponse.redirect(new URL(`/orders/${order}${ok ? '?paid=1' : '?payment=failed'}`, req.url));
  } catch { return NextResponse.redirect(new URL(`/orders/${order}?payment_error=1`, req.url)); }
}
