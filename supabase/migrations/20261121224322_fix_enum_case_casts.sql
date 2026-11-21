-- CASE expressions made only of string literals resolve to text; cast them to the enum types.
do $$
declare d text;
begin
  d := pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
  d := replace(d, $x$case when v_method = 'cod' then 'pending' else 'initiated' end$x$,
                  $x$(case when v_method = 'cod' then 'pending' else 'initiated' end)::public.payment_status$x$);
  execute d;
  d := pg_get_functiondef('public.admin_record_refund(uuid,numeric,text,boolean,text,text)'::regprocedure);
  d := replace(d, $x$status = case when v_full then 'refunded' else 'partially_refunded' end where id = v_pay$x$,
                  $x$status = (case when v_full then 'refunded' else 'partially_refunded' end)::public.payment_status where id = v_pay$x$);
  d := replace(d, $x$payment_status = case when v_full then 'refunded' else 'partially_refunded' end,$x$,
                  $x$payment_status = (case when v_full then 'refunded' else 'partially_refunded' end)::public.payment_status,$x$);
  execute d;
  d := pg_get_functiondef('private.issue_invoice(uuid,public.invoice_type,numeric,text)'::regprocedure);
  d := replace(d, $x$case when v_vat_applies and s.vat_registration_no is not null then 'not_submitted' else 'not_applicable' end,$x$,
                  $x$(case when v_vat_applies and s.vat_registration_no is not null then 'not_submitted' else 'not_applicable' end)::public.zatca_status,$x$);
  execute d;
end $$;
