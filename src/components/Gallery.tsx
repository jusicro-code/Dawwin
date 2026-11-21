'use client';
import { useState } from 'react';
import { mediaUrl, type Media } from '@/lib/media';
import { Film } from './icons';
export function Gallery({ media, name, demoLabel, videoLabel }: { media: Media[]; name: string; demoLabel: string; videoLabel: string }) {
  const list = media.length ? media : [{ media_type: 'image', storage_path: 'placeholder:sheep', external_url: null, is_placeholder: true } as Media];
  const [i, setI] = useState(0);
  const cur = list[Math.min(i, list.length - 1)];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-sand-200 bg-sand-100">
        {cur.media_type === 'video'
          ? <video src={mediaUrl(cur)} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={mediaUrl(cur)} alt={name} className="h-full w-full object-cover" />}
        {cur.is_placeholder && <span className="absolute start-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-medium text-white">{demoLabel}</span>}
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
