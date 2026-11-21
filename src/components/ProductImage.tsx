import { mediaUrl, type Media } from '@/lib/media';
export function ProductImage({ media, alt, demoLabel, className = '', priority = false }: { media?: Media; alt: string; demoLabel: string; className?: string; priority?: boolean }) {
  const src = media ? mediaUrl(media) : '/placeholders/sheep.svg';
  const placeholder = !media || media.is_placeholder;
  return (
    <div className={`relative overflow-hidden bg-sand-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
      {placeholder && (
        <span className="absolute start-2 top-2 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-medium text-white">{demoLabel}</span>
      )}
    </div>
  );
}
