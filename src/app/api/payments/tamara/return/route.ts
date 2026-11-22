import { NextResponse, type NextRequest } from 'next/server';
import { verifyTamaraOrder } from '@/lib/payments/tamara';
export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get('order') || '';
  const tamaraId = req.nextUrl.searchParams.get('orderId') || '';
  if (!/^[0-9a-f-]{36}$/.test(order)) return NextResponse.redirect(new URL('/', req.url));
  try {
    const r = tamaraId ? await verifyTamaraOrder(tamaraId) : { result: 'pending', orderId: order };
    const ok = r.orderId === order && ['paid', 'already_paid', 'authorized'].includes(r.result);
    return NextResponse.redirect(new URL(`/orders/${order}${ok ? '?paid=1' : '?payment=failed'}`, req.url));
  } catch { return NextResponse.redirect(new URL(`/orders/${order}?payment_error=1`, req.url)); }
}
