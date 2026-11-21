import { Suspense } from 'react';
import { ForgotForm } from '@/components/AuthForms';
export const dynamic = 'force-dynamic';
export default function Page() { return <Suspense><ForgotForm /></Suspense>; }
