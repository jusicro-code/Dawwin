'use client';
import { useEffect, useRef } from 'react';
declare global { interface Window { Moyasar?: { init: (c: Record<string, unknown>) => void } } }
export function MoyasarForm({ config, orderId }: { config: Record<string, unknown>; orderId: string }) {
  const done = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!window.Moyasar || done.current) return;
      done.current = true; clearInterval(timer);
      window.Moyasar.init({
        element: '.mysr-form', ...config,
        // Record the payment id server-side before redirect; status is still verified with Moyasar's API.
        on_completed: async (payment: { id: string }) => {
          await fetch('/api/payments/moyasar/attach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: orderId, payment_id: payment.id }) });
        },
      });
    }, 200);
    return () => clearInterval(timer);
  }, [config, orderId]);
  return <div className="mysr-form" />;
}
