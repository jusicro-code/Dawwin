import { Suspense } from 'react';
import { RegisterForm } from '@/components/AuthForms';
export const dynamic = 'force-dynamic';
export default function Page() { return <Suspense><RegisterForm /></Suspense>; }
