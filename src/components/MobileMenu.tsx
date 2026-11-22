'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from './icons';
export function MobileMenu({ links, logo, name }: { links: { href: string; label: string }[]; logo?: string; name?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button aria-label="menu" onClick={() => setOpen(!open)} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand-100">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full z-40 border-b border-sand-200 bg-white px-4 py-3 shadow-card">
          {logo && <div className="mb-2 flex items-center gap-2 border-b border-sand-100 pb-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={logo} alt="" className="h-9 w-9 rounded-lg" /><span className="font-bold text-brand">{name}</span></div>}
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-[15px] hover:bg-sand-100">{l.label}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
