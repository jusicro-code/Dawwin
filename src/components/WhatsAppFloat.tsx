import { waLink } from '@/lib/format';
import { WhatsAppIcon } from './WhatsAppIcon';
export function WhatsAppFloat({ phone, label, text }: { phone: string; label: string; text?: string }) {
  return (
    <a href={waLink(phone, text)} target="_blank" rel="noopener noreferrer" aria-label={label} data-testid="whatsapp-float"
      className="fixed bottom-5 end-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white/60 transition hover:scale-105">
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
