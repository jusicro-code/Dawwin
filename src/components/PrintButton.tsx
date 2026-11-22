'use client';
import { Printer } from './icons';
export function PrintButton({ label = 'طباعة / حفظ PDF — Print / Save PDF' }: { label?: string }) {
  return <button onClick={() => window.print()} className="btn-primary"><Printer className="h-4 w-4" />{label}</button>;
}
