create or replace function public.best_seller_ids(p_limit int default 4)
returns table(product_id uuid) language sql stable security definer set search_path = '' as $$
  select oi.product_id from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.products p on p.id = oi.product_id
   where o.payment_status in ('paid','partially_refunded') and not p.is_hidden and not p.is_archived
   group by oi.product_id order by sum(oi.quantity) desc limit least(p_limit, 12);
$$;
grant execute on function public.best_seller_ids(int) to anon, authenticated;

create or replace function private.sync_mode_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.inventory_mode = 'individual' and old.inventory_mode is distinct from 'individual' then
    new.stock_quantity := (select count(*) from public.animals a where a.product_id = new.id and a.status = 'available');
  end if;
  return new;
end $$;
drop trigger if exists trg_sync_mode_stock on public.products;
create trigger trg_sync_mode_stock before update of inventory_mode on public.products
  for each row execute function private.sync_mode_stock();
