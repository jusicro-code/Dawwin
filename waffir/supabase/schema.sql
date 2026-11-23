-- وفّر: جداول مقارنة أسعار السوبرماركت
-- القراءة متاحة للجميع (التطبيق ما يحتاج تسجيل دخول)، والكتابة فقط من لوحة Supabase.

create table if not exists public.stores (
  id text primary key,
  name text not null,
  color text not null default '#16A34A',
  logo_url text,
  sort int not null default 0
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  emoji text,
  sort int not null default 0
);

create table if not exists public.products (
  id text primary key,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  size text,
  emoji text,
  image_url text,
  barcode text
);
create index if not exists products_category_idx on public.products(category_id);

create table if not exists public.prices (
  product_id text not null references public.products(id) on delete cascade,
  store_id text not null references public.stores(id) on delete cascade,
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2),
  updated_at timestamptz not null default now(),
  primary key (product_id, store_id)
);
create index if not exists prices_store_idx on public.prices(store_id);

create table if not exists public.ads (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  subtitle text,
  bg_color text not null default '#065F46',
  emoji text,
  image_url text,
  link_url text,
  active boolean not null default true,
  sort int not null default 0
);

alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.prices enable row level security;
alter table public.ads enable row level security;

create policy "public read stores" on public.stores for select to anon, authenticated using (true);
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "public read products" on public.products for select to anon, authenticated using (true);
create policy "public read prices" on public.prices for select to anon, authenticated using (true);
create policy "public read active ads" on public.ads for select to anon, authenticated using (active);
