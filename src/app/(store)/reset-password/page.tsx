import { Suspense } from 'react';
import { ResetForm } from '@/components/AuthForms';
export const dynamic = 'force-dynamic';
export default function Page() { return <Suspense><ResetForm /></Suspense>; }
