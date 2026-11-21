-- Monthly BRL planning; manual entries, not provider invoices.
create table if not exists avespet_infra.monthly_budget(
 month_start date primary key check(extract(day from month_start)=1),
 budget_cents bigint not null check(budget_cents between 1 and 100000000),
 forecasts jsonb not null, confirmed jsonb not null,
 updated_at timestamptz not null default now()
);
alter table avespet_infra.monthly_budget enable row level security;
revoke all on avespet_infra.monthly_budget from public,anon,authenticated;
create or replace function public.master_infra_budget(p_actor uuid,p_save jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m date:=date_trunc('month',now() at time zone 'America/Sao_Paulo')::date;
 v avespet_infra.monthly_budget%rowtype; k text; f jsonb; c jsonb; b bigint; total_f bigint; total_c bigint;
 keys text[]:=array['supabase','vercel','gemini','resend','other'];
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_save is not null then
  if jsonb_typeof(p_save) is distinct from 'object' or p_save->>'month_start' is distinct from m::text then raise exception 'Invalid month'; end if;
  if jsonb_typeof(p_save->'budget_cents') is distinct from 'number' or (p_save->>'budget_cents') !~ '^[0-9]{1,9}$' then raise exception 'Invalid budget'; end if;
  b:=(p_save->>'budget_cents')::bigint;
  if b<1 or b>100000000 then raise exception 'Invalid budget'; end if;
  f:=p_save->'forecasts';c:=p_save->'confirmed';
  if jsonb_typeof(f) is distinct from 'object' or jsonb_typeof(c) is distinct from 'object' then raise exception 'Invalid entries'; end if;
  if (select count(*) from jsonb_object_keys(f))<>5 or (select count(*) from jsonb_object_keys(c))<>5 then raise exception 'Invalid entries'; end if;
  foreach k in array keys loop
   if not (f?k and c?k) then raise exception 'Missing entry'; end if;
   if f->k<>'null'::jsonb and (jsonb_typeof(f->k)<>'number' or (f->>k)!~'^[0-9]{1,8}$') then raise exception 'Invalid forecast'; end if;
   if c->k<>'null'::jsonb and (jsonb_typeof(c->k)<>'number' or (c->>k)!~'^[0-9]{1,8}$') then raise exception 'Invalid confirmed cost'; end if;
  end loop;
  insert into avespet_infra.monthly_budget(month_start,budget_cents,forecasts,confirmed)
  values(m,b,f,c) on conflict(month_start) do update set budget_cents=excluded.budget_cents,forecasts=excluded.forecasts,confirmed=excluded.confirmed,updated_at=now();
  insert into public.master_audit_log(actor_user_id,action,resource_type,resource_id,metadata)
  values(p_actor,'infra_budget_saved','infra_budget',m::text,jsonb_build_object('budget_cents',b,'forecasts',f,'confirmed',c));
 end if;
 select * into v from avespet_infra.monthly_budget where month_start=m;
 if not found then return jsonb_build_object('month_start',m,'configured',false); end if;
 select sum(value::bigint) into total_f from jsonb_each_text(v.forecasts) where value is not null;
 select sum(value::bigint) into total_c from jsonb_each_text(v.confirmed) where value is not null;
 return to_jsonb(v)||jsonb_build_object('configured',true,'forecast_total_cents',total_f,'confirmed_total_cents',total_c,
 'forecast_complete',(select count(value)=5 from jsonb_each_text(v.forecasts)),
 'confirmed_complete',(select count(value)=5 from jsonb_each_text(v.confirmed)));
end $$;
revoke all on function public.master_infra_budget(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.master_infra_budget(uuid,jsonb) to service_role;
