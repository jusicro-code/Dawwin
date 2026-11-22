/** Shown wherever the store has not yet uploaded a real photograph of the actual animal. Never an illustration of livestock. */
export function AwaitingPhoto({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-br from-brand to-brand-2 text-center ${className}`} role="img" aria-label={label}>
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #D5A84A 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-160.png" alt="" className="relative h-14 w-14 rounded-2xl bg-sand-50 p-1.5 opacity-90" />
      <span className="relative rounded-full border border-gold/60 px-3 py-1 text-xs font-medium text-gold">{label}</span>
    </div>
  );
}
