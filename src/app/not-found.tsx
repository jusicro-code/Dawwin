import Link from 'next/link';
export default function NotFound() {
  return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-3xl font-bold">404</h1><p className="mt-2 text-ink/60">الصفحة غير موجودة · Page not found</p><Link href="/" className="btn-primary mt-6">الرئيسية · Home</Link></div>;
}
