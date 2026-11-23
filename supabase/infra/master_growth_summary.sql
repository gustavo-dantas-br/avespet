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
 'sources_month',(select coalesce(jsonb_agg(jsonb_build_object('channel',s.channel,'accounts',s.n) order by s.n desc,s.channel),'[]'::jsonb) from (select case when raw_user_meta_data->>'growth_source_v1' in ('instagram','facebook','google','whatsapp','youtube','indicacao','outro') then raw_user_meta_data->>'growth_source_v1' else 'unknown' end as channel,count(*) as n from auth.users where created_at>=m::timestamp at time zone 'America/Sao_Paulo' group by 1) s),
 'cohort_funnel',(with cohort as (
 select u.id,u.email_confirmed_at is not null as confirmed,u.last_sign_in_at is not null as signed_in,
 exists(select 1 from public.perfil_criador p where p.user_id=u.id) as profile,
 exists(select 1 from public.aves a where a.user_id=u.id) as birds
 from auth.users u where u.created_at>=m::timestamp at time zone 'America/Sao_Paulo'
 ) select jsonb_build_object('accounts',count(*),'confirmed',count(*) filter(where confirmed),'signed_in',count(*) filter(where confirmed and signed_in),'profiles',count(*) filter(where confirmed and signed_in and profile),'birds',count(*) filter(where confirmed and signed_in and profile and birds)) from cohort),
 'engagement',(with base as (
 select u.id,u.email_confirmed_at,a.last_seen_at,greatest(u.last_sign_in_at,a.last_seen_at) as last_activity
 from auth.users u left join public.email_user_activity a on a.user_id=u.id
 where not exists(select 1 from public.master_admins m where m.user_id=u.id)
 ) select jsonb_build_object('accounts',count(*),'active_7d',count(*) filter(where last_activity>=now()-interval '7 days'),'active_30d',count(*) filter(where last_activity>=now()-interval '30 days'),'inactive_8_30',count(*) filter(where last_activity<now()-interval '7 days' and last_activity>=now()-interval '30 days'),'inactive_31plus',count(*) filter(where last_activity<now()-interval '30 days'),'no_activity',count(*) filter(where last_activity is null),'unconfirmed',count(*) filter(where email_confirmed_at is null),'instrumented',count(*) filter(where last_seen_at is not null)) from base),
 'subscription_overview',(with eligible as (select u.id from auth.users u where not exists(select 1 from public.master_admins m where m.user_id=u.id)), current_records as (select s.* from public.creator_subscriptions s join eligible e on e.id=s.user_id where s.status in ('active','trialing') and s.starts_at<=now() and (s.ends_at is null or s.ends_at>now()))
 select jsonb_build_object('accounts', (select count(*) from eligible),'current_accounts',(select count(distinct user_id) from current_records),'without_current_record',(select count(*) from eligible e where not exists(select 1 from current_records s where s.user_id=e.id)) ,'active_overrides',(select count(*) from public.creator_entitlement_overrides o join eligible e on e.id=o.user_id where o.expires_at is null or o.expires_at>now()),'by_status',(select coalesce(jsonb_object_agg(status,n),'{}'::jsonb) from (select s.status,count(*) n from public.creator_subscriptions s join eligible e on e.id=s.user_id group by s.status) x),'by_plan',(select coalesce(jsonb_agg(jsonb_build_object('code',p.code,'name',p.name,'is_free',p.is_free,'is_active',p.is_active,'max_birds',p.max_birds,'accounts', (select count(distinct user_id) from current_records s where s.plan_id=p.id)) order by p.sort_order),'[]'::jsonb) from public.platform_plans p))),
 'finance',(select jsonb_build_object(
 'campaign_revenue_confirmed_cents',coalesce(sum(o.contracted_cents) filter(where o.payment_confirmed_at is not null),0),
 'campaign_confirmed_orders',count(*) filter(where o.payment_confirmed_at is not null),
 'campaign_confirmed_this_month_cents',coalesce(sum(o.contracted_cents) filter(where o.payment_confirmed_at >=m::timestamp at time zone 'America/Sao_Paulo'),0),
 'orders_without_confirmation',count(*) filter(where o.payment_confirmed_at is null),
 'request_count',(select count(*) from public.solicitacoes_campanhas_aves),
 'requests_without_value',(select count(*) from public.solicitacoes_campanhas_aves where catalog_price_cents is null and valor is null),
 'subscription_mrr_cents',null,
 'subscription_mrr_reason','Não há faturas nem confirmação de recebimentos recorrentes integradas',
 'subscription_payments_integrated',false,
 'campaign_payments_manually_confirmed',true
 ) from public.campaign_order_operations o),
 'subscription_records',(select count(*) from public.creator_subscriptions),
 'paid_plan_records',(select count(*) from public.creator_subscriptions s join public.platform_plans p on p.id=s.plan_id where not p.is_free),
 'plans',(select coalesce(jsonb_agg(jsonb_build_object('code',code,'name',name,'is_free',is_free,'is_active',is_active) order by sort_order),'[]'::jsonb) from public.platform_plans));
end $$;
revoke all on function public.master_growth_summary(uuid) from public,anon,authenticated;
grant execute on function public.master_growth_summary(uuid) to service_role;
