'use client';
import { useState } from 'react';
import { mediaUrl, type Media } from '@/lib/media';
import { Film } from './icons';
import { AwaitingPhoto } from './AwaitingPhoto';
export function Gallery({ media, name, demoLabel, videoLabel }: { media: Media[]; name: string; demoLabel: string; videoLabel: string }) {
  const real = media.filter((m) => !m.is_placeholder);
  const [i, setI] = useState(0);
  if (real.length === 0) return <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-sand-200"><AwaitingPhoto label={demoLabel} /></div>;
  const list = real;
  const cur = list[Math.min(i, list.length - 1)];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-sand-200 bg-sand-100">
        {cur.media_type === 'video'
          ? <video src={mediaUrl(cur)} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={mediaUrl(cur)} alt={name} className="h-full w-full object-cover" />}
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {list.map((m, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`${name} ${k + 1}`} className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${k === i ? 'border-brand' : 'border-transparent'}`}>
              {m.media_type === 'video'
                ? <span className="flex h-full w-full items-center justify-center bg-ink text-white"><Film className="h-5 w-5" /><span className="sr-only">{videoLabel}</span></span>
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={mediaUrl(m)} alt="" className="h-full w-full object-cover" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
