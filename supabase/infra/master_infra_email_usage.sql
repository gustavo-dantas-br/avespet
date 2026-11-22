-- E-mails conhecidos pelo Avespet, não o faturamento global da conta Resend.
create or replace function public.master_infra_email_summary(p_actor uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; month_start timestamptz := date_trunc('month',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'; day_start timestamptz := date_trunc('day',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 with events as (
 select 'approval'::text as category,status,provider_id,created_at,sent_at as accepted_at from public.aves_perdidas_emails_aprovacao
 union all select 'reengagement',status,provider_id,created_at,sent_at from public.email_reengagement_delivery
 union all select 'infra',status,provider_id,created_at,attempted_at from avespet_infra.alert_outbox
 ), accepted as (
 select distinct on(provider_id) provider_id,category,accepted_at from events
 where status='sent' and provider_id is not null and provider_id<>'' and accepted_at is not null
 order by provider_id,accepted_at,category
 ), categories as (select unnest(array['approval','reengagement','infra']) as category)
 select jsonb_build_object('zone','America/Sao_Paulo','scope','partial_local_records',
 'accepted_today',(select count(*) from accepted where accepted_at>=day_start),
 'accepted_month',(select count(*) from accepted where accepted_at>=month_start),
 'failed_month',(select count(*) from events where status='failed' and created_at>=month_start),
 'uncertain_month',(select count(*) from events where status='uncertain' and created_at>=month_start),
 'categories',(select jsonb_agg(jsonb_build_object('category',c.category,'accepted_month',(select count(*) from accepted a where a.category=c.category and a.accepted_at>=month_start),'failed_month',(select count(*) from events e where e.category=c.category and e.status='failed' and e.created_at>=month_start)) order by c.category) from categories c),
 'daily',(select coalesce(jsonb_agg(to_jsonb(d) order by d.day_date),'[]'::jsonb) from (select (accepted_at at time zone 'America/Sao_Paulo')::date as day_date,count(*) as accepted from accepted where accepted_at>=day_start-interval '29 days' group by 1) d)) into result;
 return result;
end $$;
revoke all on function public.master_infra_email_summary(uuid) from public,anon,authenticated;
grant execute on function public.master_infra_email_summary(uuid) to service_role;
