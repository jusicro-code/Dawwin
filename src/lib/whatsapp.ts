import 'server-only';
import { serverEnv, providerConfigured } from './server-env';
import { svc } from './payments/svc';

type Notif = { id: string; channel: string; template: string; body_ar: string | null; body_en: string | null; payload: { to?: string; order_number?: string; status?: string; total?: number } };

/** WhatsApp Cloud API: business-initiated messages must use an approved template. */
async function sendTemplate(to: string, params: string[]) {
  const url = `https://graph.facebook.com/v21.0/${serverEnv.whatsapp.phoneNumberId}/messages`;
  const r = await fetch(url, {
    method: 'POST', headers: { Authorization: `Bearer ${serverEnv.whatsapp.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to: to.replace(/\D/g, ''), type: 'template',
      template: { name: serverEnv.whatsapp.templateName, language: { code: serverEnv.whatsapp.templateLang }, components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }] },
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `whatsapp ${r.status}`);
  return String(j?.messages?.[0]?.id || '');
}

export async function dispatchNotifications() {
  const list = await svc<Notif[]>('svc_queued_notifications', { p_limit: 25 });
  let sent = 0, skipped = 0, failed = 0;
  for (const n of list || []) {
    try {
      if (n.channel === 'whatsapp' && providerConfigured.whatsapp() && n.payload?.to) {
        const id = await sendTemplate(n.payload.to, [n.payload.order_number || '', n.body_ar || '']);
        await svc('svc_mark_notification', { p_id: n.id, p_status: 'sent', p_provider_id: id, p_error: null }); sent++;
      } else {
        await svc('svc_mark_notification', { p_id: n.id, p_status: 'skipped', p_provider_id: null, p_error: `${n.channel} provider not configured` }); skipped++;
      }
    } catch (e) {
      await svc('svc_mark_notification', { p_id: n.id, p_status: 'queued', p_provider_id: null, p_error: (e as Error).message }); failed++;
    }
  }
  return { sent, skipped, failed };
}
