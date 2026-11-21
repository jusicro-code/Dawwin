-- =====================================================================
-- Migration 2: security model, RLS, business functions
-- Builds on 20261121203409_core_schema (tables + enums).
-- =====================================================================

-- ---------- private schema (not exposed through the Data API) ----------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.config (
  key   text primary key,
  value text not null
);

-- ---------- sensitive cost data moves to a staff-only table ----------
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(12,2) not null check (cost_price >= 0),
  updated_at timestamptz not null default now()
);
insert into public.product_costs(product_id, cost_price)
  select id, cost_price from public.products where cost_price is not null
  on conflict do nothing;
alter table public.products drop column if exists cost_price;
alter table public.order_items drop column if exists unit_cost;

create sequence if not exists public.order_number_seq start 1001;

-- helpful indexes
create index if not exists idx_orders_user on public.orders(user_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_product on public.order_items(product_id);
create index if not exists idx_osh_order on public.order_status_history(order_id, created_at);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_product_images_product on public.product_images(product_id, sort_order);
create index if not exists idx_animals_product on public.animals(product_id, status);
create index if not exists idx_inv_mov_product on public.inventory_movements(product_id, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_addresses_user on public.delivery_addresses(user_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_invoices_order on public.invoices(order_id);

-- =====================================================================
-- Role helpers
-- =====================================================================
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid());
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles
                where user_id = auth.uid() and role in ('owner','admin'));
$$;

create or replace function public.my_roles() returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(role::text), '{}') from public.user_roles where user_id = auth.uid();
$$;

-- server secret check for trusted server-side calls (webhooks, payment verification)
create or replace function private.assert_server(p_secret text) returns void
language plpgsql stable security definer set search_path = '' as $$
declare v text;
begin
  select value into v from private.config where key = 'server_secret_sha256';
  if v is null or p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

-- generic rate limiter (fixed window)
create or replace function private.rate_limit(p_key text, p_max int, p_window_seconds int) returns void
language plpgsql security definer set search_path = '' as $$
declare v_hits int;
begin
  insert into public.rate_limits(key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                then 1 else public.rate_limits.hits + 1 end,
    window_start = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                then now() else public.rate_limits.window_start end
  returning hits into v_hits;
  if v_hits > p_max then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
end $$;

-- audit helper
create or replace function private.audit(p_action text, p_table text, p_record text, p_old jsonb, p_new jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs(actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), p_action, p_table, p_record, p_old, p_new);
$$;

-- generic audit trigger for admin-managed tables
create or replace function private.audit_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.audit(lower(tg_op), tg_table_name,
    coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id',
             (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'product_id',
             (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'user_id'),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['products','product_costs','categories','store_settings','preparation_services',
    'delivery_zones','delivery_slots','bulk_discount_rules','coupons','promotions','user_roles','animals',
    'delivery_personnel','operating_expenses']
  loop
    execute format('drop trigger if exists trg_audit on public.%I', t);
    execute format('create trigger trg_audit after insert or update or delete on public.%I
                    for each row execute function private.audit_trigger()', t);
  end loop;
end $$;

-- =====================================================================
-- New user bootstrap + owner auto-grant on verified email
-- =====================================================================
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_owner text; v_phone text;
begin
  v_phone := new.raw_user_meta_data->>'phone';
  if v_phone is not null and v_phone !~ '^\+9665[0-9]{8}$' then v_phone := null; end if;
  insert into public.profiles(id, full_name, phone, preferred_language)
  values (new.id,
          left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 120),
          v_phone,
          case when new.raw_user_meta_data->>'lang' = 'en' then 'en' else 'ar' end)
  on conflict (id) do nothing;

  select value into v_owner from private.config where key = 'owner_email';
  if v_owner is not null and lower(new.email) = lower(v_owner) and new.email_confirmed_at is not null then
    insert into public.user_roles(user_id, role) values (new.id, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;

create or replace function private.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_owner text;
begin
  select value into v_owner from private.config where key = 'owner_email';
  if v_owner is not null and lower(new.email) = lower(v_owner)
     and new.email_confirmed_at is not null and old.email_confirmed_at is null then
    insert into public.user_roles(user_id, role) values (new.id, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function private.handle_user_confirmed();

-- customers cannot promote themselves to wholesale
create or replace function private.protect_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.customer_type is distinct from old.customer_type and not public.is_admin()
     and auth.role() <> 'service_role' then
    raise exception 'Only administrators can change customer type' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile before update on public.profiles
  for each row execute function private.protect_profile();

-- only one default address per user
create or replace function private.single_default_address() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_default then
    update public.delivery_addresses set is_default = false
     where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end $$;
drop trigger if exists trg_single_default_addr on public.delivery_addresses;
create trigger trg_single_default_addr after insert or update of is_default on public.delivery_addresses
  for each row when (new.is_default) execute function private.single_default_address();

-- =====================================================================
-- Individual-animal inventory keeps products.stock_quantity in sync
-- =====================================================================
create or replace function private.sync_animal_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_pid uuid;
begin
  v_pid := coalesce(new.product_id, old.product_id);
  update public.products p
     set stock_quantity = (select count(*) from public.animals a
                            where a.product_id = v_pid and a.status = 'available')
   where p.id = v_pid and p.inventory_mode = 'individual';
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    update public.products p
       set stock_quantity = (select count(*) from public.animals a
                              where a.product_id = old.product_id and a.status = 'available')
     where p.id = old.product_id and p.inventory_mode = 'individual';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists trg_sync_animal_stock on public.animals;
create trigger trg_sync_animal_stock after insert or update or delete on public.animals
  for each row execute function private.sync_animal_stock();

-- =====================================================================
-- RLS
-- =====================================================================
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- drop any previous policies so the migration is re-runnable
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Staff (owner/admin/staff) can read everything; admins write catalog/settings; staff write order ops.
do $$
declare t text;
begin
  -- catalog & configuration: read by staff, write by admins
  foreach t in array array['store_settings','categories','products','product_images','animals','product_costs',
    'preparation_services','delivery_zones','delivery_slots','delivery_blackout_dates','bulk_discount_rules',
    'coupons','promotions','user_roles','operating_expenses','delivery_personnel']
  loop
    execute format('create policy staff_read on public.%I for select to authenticated using (public.is_staff())', t);
    execute format('create policy admin_write on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  -- operations: read + write by any staff
  foreach t in array array['orders','order_items','order_status_history','order_internal_notes','delivery_assignments',
    'customer_notes','payments','payment_events','refunds','invoices','invoice_items','notifications','reviews',
    'profiles','delivery_addresses','coupon_redemptions','inventory_movements','audit_logs','favorites','carts','cart_items']
  loop
    execute format('create policy staff_read on public.%I for select to authenticated using (public.is_staff())', t);
  end loop;
  foreach t in array array['order_internal_notes','delivery_assignments','customer_notes','notifications','reviews','profiles']
  loop
    execute format('create policy staff_write on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- Public catalog
create policy public_read on public.store_settings for select to anon, authenticated using (true);
create policy public_read on public.categories for select to anon, authenticated using (is_active);
create policy public_read on public.products for select to anon, authenticated
  using (not is_hidden and not is_archived);
create policy public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and not p.is_hidden and not p.is_archived));
create policy public_read on public.animals for select to anon, authenticated
  using (status = 'available' and exists (select 1 from public.products p
         where p.id = product_id and not p.is_hidden and not p.is_archived));
create policy public_read on public.preparation_services for select to anon, authenticated
  using (is_enabled and (code = 'live' or owner_confirmed_authorized));
create policy public_read on public.delivery_zones for select to anon, authenticated using (is_active);
create policy public_read on public.delivery_slots for select to anon, authenticated using (is_active);
create policy public_read on public.delivery_blackout_dates for select to anon, authenticated using (true);
create policy public_read on public.bulk_discount_rules for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy public_read on public.promotions for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy public_read on public.reviews for select to anon, authenticated using (is_approved);

-- Own records
create policy own_read on public.profiles for select to authenticated using (id = auth.uid());
create policy own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy own_all on public.delivery_addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_all on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_all on public.carts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_all on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy own_read on public.orders for select to authenticated using (user_id = auth.uid());
create policy own_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_read on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_read on public.delivery_assignments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_read on public.invoices for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_read on public.invoice_items for select to authenticated
  using (exists (select 1 from public.invoices i join public.orders o on o.id = i.order_id
                 where i.id = invoice_id and o.user_id = auth.uid()));
create policy own_read on public.notifications for select to authenticated
  using (user_id = auth.uid() and audience = 'customer' and channel = 'in_app');
create policy own_mark_read on public.notifications for update to authenticated
  using (user_id = auth.uid() and audience = 'customer') with check (user_id = auth.uid() and audience = 'customer');
create policy own_read on public.reviews for select to authenticated using (user_id = auth.uid());

-- Column-level guard: customers may only flip read_at on notifications
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
-- Customers may not change ids / customer_type through direct updates (trigger also guards type)
revoke update on public.profiles from authenticated;
grant update (full_name, phone, preferred_language, customer_type) on public.profiles to authenticated;

-- =====================================================================
-- Storage bucket for product media (images + videos)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product media admin insert" on storage.objects;
drop policy if exists "product media admin update" on storage.objects;
drop policy if exists "product media admin delete" on storage.objects;
create policy "product media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-media' and public.is_admin());
create policy "product media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-media' and public.is_admin());
create policy "product media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-media' and public.is_admin());
