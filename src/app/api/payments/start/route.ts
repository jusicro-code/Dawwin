import { NextResponse, type NextRequest } from 'next/server';
import { startOnlinePayment } from '@/lib/payments';
import { getLocale } from '@/lib/i18n/server';
export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get('order') || '';
  if (!/^[0-9a-f-]{36}$/.test(order)) return NextResponse.redirect(new URL('/', req.url));
  const r = await startOnlinePayment(order, await getLocale());
  return NextResponse.redirect(new URL('url' in r ? r.url : `/orders/${order}?payment_error=1`, req.url));
}
