do $$
declare d text;
begin
  d := pg_get_functiondef('public.admin_adjust_stock(uuid,integer,text)'::regprocedure);
  d := replace(d, $x$case when p_delta > 0 then 'restock' else 'adjustment' end$x$,
                  $x$(case when p_delta > 0 then 'restock' else 'adjustment' end)::public.movement_reason$x$);
  execute d;
end $$;
