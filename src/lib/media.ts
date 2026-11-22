import { SUPABASE_URL } from './env';
export type Media = { id?: string; media_type: 'image' | 'video'; storage_path: string | null; external_url: string | null; is_placeholder: boolean; alt_ar?: string | null; alt_en?: string | null; sort_order?: number };
export function mediaUrl(m: Pick<Media, 'storage_path' | 'external_url'>) {
  if (m.external_url) return m.external_url;
  const p = m.storage_path || '';
  if (p.startsWith('placeholder:')) return '/brand/logo.png';
  return `${SUPABASE_URL}/storage/v1/object/public/product-media/${p.split('/').map(encodeURIComponent).join('/')}`;
}
