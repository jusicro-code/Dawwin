update public.store_settings set store_name_ar = 'مواشي بلس', store_name_en = 'Mawashi Plus', is_name_temporary = false,
  logo_url = '/brand/logo-160.png', brand_colors = '{"primary":"#073F2E","secondary":"#0D5940","accent":"#D5A84A"}'
where id = 1;
-- No invented stock: reset placeholder quantities to 0 with an auditable movement.
insert into public.inventory_movements(product_id, delta, reason, note)
select id, -stock_quantity, 'adjustment', 'Reset placeholder stock to 0 — owner must enter the real counted quantity'
from public.products where inventory_mode = 'quantity' and stock_quantity > 0;
update public.products set stock_quantity = 0 where inventory_mode = 'quantity';

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('complaint','inquiry','order_issue','refund_request')),
  name text not null check (char_length(name) between 2 and 120),
  phone text check (phone is null or phone ~ '^\+9665[0-9]{8}$'),
  email text check (email is null or char_length(email) <= 200),
  order_number text check (order_number is null or char_length(order_number) <= 40),
  message text not null check (char_length(message) between 5 and 4000),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  staff_reply text check (staff_reply is null or char_length(staff_reply) <= 4000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.support_requests enable row level security;
create policy staff_all on public.support_requests for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy own_read on public.support_requests for select to authenticated using (user_id = auth.uid());
create index if not exists idx_support_created on public.support_requests(created_at desc);

create or replace function public.submit_support_request(p_kind text, p_name text, p_phone text, p_email text, p_order_number text, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.rate_limit('support:' || coalesce(auth.uid()::text, coalesce(p_phone, p_email, 'anon')), 5, 3600);
  insert into public.support_requests(user_id, kind, name, phone, email, order_number, message)
  values (auth.uid(), p_kind, trim(p_name), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(upper(trim(p_order_number)),''), trim(p_message))
  returning id into v_id;
  insert into public.notifications(audience, channel, template, title_ar, title_en, body_ar, body_en, status, sent_at)
  values ('admin','in_app','support_request', 'طلب دعم/شكوى جديد', 'New support request', left(trim(p_message), 200), left(trim(p_message), 200), 'sent', now());
  return v_id;
end $$;
grant execute on function public.submit_support_request(text,text,text,text,text,text) to anon, authenticated;

create or replace function public.latest_reviews(p_limit int default 6)
returns table(id uuid, rating smallint, body text, reviewer_display_name text, created_at timestamptz, product_name_ar text, product_name_en text, product_slug text)
language sql stable security definer set search_path = '' as $$
  select r.id, r.rating, r.body, r.reviewer_display_name, r.created_at, p.name_ar, p.name_en, p.slug
    from public.reviews r join public.products p on p.id = r.product_id
   where r.is_approved and not p.is_hidden and not p.is_archived
   order by r.created_at desc limit least(p_limit, 20);
$$;
grant execute on function public.latest_reviews(int) to anon, authenticated;
