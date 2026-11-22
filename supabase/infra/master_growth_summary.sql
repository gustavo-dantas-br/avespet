-- Dashboard de crescimento: agregados administrativos, sem novas coletas.
create or replace function public.master_growth_summary(p_actor uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare today date := (now() at time zone 'America/Sao_Paulo')::date; m date:=date_trunc('month',today::timestamp)::date;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 return jsonb_build_object('generated_at',now(),'month_start',m,
 'accounts',(select count(*) from auth.users),
 'new_month',(select count(*) from auth.users where created_at>=m::timestamp at time zone 'America/Sao_Paulo'),
 'login_30d',(select count(*) from auth.users where last_sign_in_at>=now()-interval '30 days'),
 'profiles',(select count(*) from auth.users u where exists(select 1 from public.perfil_criador p where p.user_id=u.id)),
 'bird_owners',(select count(*) from auth.users u where exists(select 1 from public.aves a where a.user_id=u.id)),
 'profile_and_birds',(select count(*) from auth.users u where exists(select 1 from public.perfil_criador p where p.user_id=u.id) and exists(select 1 from public.aves a where a.user_id=u.id)),
 'views_month',(select sum(total) from public.visitas_diarias where dia between m and today),
 'views_first_day',(select min(dia) from public.visitas_diarias),
 'daily',(select coalesce(jsonb_agg(jsonb_build_object('day',d.day_date,'signups',d.signups) order by d.day_date),'[]'::jsonb) from (select (created_at at time zone 'America/Sao_Paulo')::date as day_date,count(*) as signups from auth.users where created_at>=m::timestamp at time zone 'America/Sao_Paulo' group by 1) d),
 'subscription_records',(select count(*) from public.creator_subscriptions),
 'paid_plan_records',(select count(*) from public.creator_subscriptions s join public.platform_plans p on p.id=s.plan_id where not p.is_free),
 'plans',(select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'is_free',is_free,'is_active',is_active) order by sort_order),'[]'::jsonb) from public.platform_plans));
end $$;
revoke all on function public.master_growth_summary(uuid) from public,anon,authenticated;
grant execute on function public.master_growth_summary(uuid) to service_role;
