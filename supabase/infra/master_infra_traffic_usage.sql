-- Existing pageview counters only, not unique users or billable requests.
create or replace function public.master_infra_traffic_summary(p_actor uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare today date := (now() at time zone 'America/Sao_Paulo')::date; month_start date := date_trunc('month',today::timestamp)::date;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 return jsonb_build_object(
 'zone','America/Sao_Paulo','scope','instrumented_pageviews','day',today,
 'first_day',(select min(dia) from public.visitas_diarias),
 'today',coalesce((select sum(total) from public.visitas_diarias where dia=today),0),
 'month',coalesce((select sum(total) from public.visitas_diarias where dia between month_start and today),0),
 'last_30_days',coalesce((select sum(total) from public.visitas_diarias where dia between today-29 and today),0),
 'routes',coalesce((select count(distinct caminho) from public.visitas_diarias where dia between month_start and today),0),
 'top_routes',coalesce((select jsonb_agg(to_jsonb(r) order by r.views desc,r.route) from (select caminho as route,sum(total) as views from public.visitas_diarias where dia between month_start and today group by caminho order by views desc,caminho limit 10) r),'[]'::jsonb),
 'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day_date) from (select dia as day_date,sum(total) as views from public.visitas_diarias where dia between today-29 and today group by dia) d),'[]'::jsonb));
end $$;
revoke all on function public.master_infra_traffic_summary(uuid) from public,anon,authenticated;
grant execute on function public.master_infra_traffic_summary(uuid) to service_role;
