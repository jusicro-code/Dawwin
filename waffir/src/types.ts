export type Store = { id: string; name: string; color: string; logo_url?: string | null; sort?: number };
export type Category = { id: string; name: string; emoji?: string | null; sort?: number };
export type Product = { id: string; category_id: string | null; name: string; size?: string | null; emoji?: string | null; image_url?: string | null };
export type Price = { product_id: string; store_id: string; price: number; old_price?: number | null };
export type Ad = { id: string; title: string; subtitle?: string | null; bg_color: string; emoji?: string | null; image_url?: string | null; link_url?: string | null; sort?: number };
export type Catalog = { stores: Store[]; categories: Category[]; products: Product[]; prices: Price[]; ads: Ad[]; source: 'supabase' | 'sample' };
