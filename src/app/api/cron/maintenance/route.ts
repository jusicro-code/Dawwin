import { NextResponse, type NextRequest } from 'next/server';
import { createAnonClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/server-env';
import { safeEqual } from '@/lib/payments/svc';
import { dispatchNotifications } from '@/lib/whatsapp';
// Called by Vercel Cron (Authorization: Bearer CRON_SECRET). Expires unpaid orders and dispatches queued notifications.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!serverEnv.cronSecret || !safeEqual(auth, `Bearer ${serverEnv.cronSecret}`)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: expired } = await createAnonClient().rpc('run_maintenance');
  const notifications = await dispatchNotifications().catch((e) => ({ error: (e as Error).message }));
  return NextResponse.json({ expired, notifications });
}
