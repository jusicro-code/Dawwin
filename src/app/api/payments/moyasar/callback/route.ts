import { NextResponse, type NextRequest } from 'next/server';
import { verifyMoyasarPayment } from '@/lib/payments/moyasar';
// Browser redirect from Moyasar. The query string is NOT trusted: we re-fetch the payment with the secret key.
export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get('order') || '';
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/.test(order) || !id) return NextResponse.redirect(new URL('/', req.url));
  try {
    const r = await verifyMoyasarPayment(id, order);
    const ok = r.result === 'paid' || r.result === 'already_paid';
    return NextResponse.redirect(new URL(`/orders/${order}${ok ? '?paid=1' : '?payment=failed'}`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/orders/${order}?payment_error=1`, req.url));
  }
}
