'use client';
import { createContext, useContext } from 'react';
import { dictionaries, type Dict } from './dict';
import type { Locale } from '../format';
const Ctx = createContext<{ locale: Locale; t: Dict }>({ locale: 'ar', t: dictionaries.ar });
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, t: dictionaries[locale] }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);
