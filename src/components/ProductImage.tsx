import { mediaUrl, type Media } from '@/lib/media';
import { AwaitingPhoto } from './AwaitingPhoto';
export function ProductImage({ media, alt, demoLabel, className = '', priority = false }: { media?: Media; alt: string; demoLabel: string; className?: string; priority?: boolean }) {
  if (!media || media.is_placeholder) return <div className={`overflow-hidden ${className}`}><AwaitingPhoto label={demoLabel} /></div>;
  return (
    <div className={`relative overflow-hidden bg-sand-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(media)} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover" />
    </div>
  );
}
