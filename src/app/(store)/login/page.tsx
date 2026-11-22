import { Suspense } from 'react';
import { LoginForm } from '@/components/AuthForms';
export const dynamic = 'force-dynamic';
export default function Page() { return <Suspense><LoginForm /></Suspense>; }
