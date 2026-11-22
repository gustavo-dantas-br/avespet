-- Monthly report: historical samples, partial measurements, no invented billing.
create or replace function public.master_infra_monthly_report(p_actor uuid,p_month date default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare current_month date:=date_trunc('month',now() at time zone 'America/Sao_Paulo')::date;
 m date:=coalesce(p_month,current_month); next_month date; start_br timestamptz; end_br timestamptz;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 if extract(day from m)<>1 or m>current_month or m<current_month-interval '23 months' then raise exception 'Invalid month'; end if;
 next_month:=(m+interval '1 month')::date;
 start_br:=m::timestamp at time zone 'America/Sao_Paulo'; end_br:=next_month::timestamp at time zone 'America/Sao_Paulo';
 return jsonb_build_object('month_start',m,'current_month',current_month,'generated_at',now(),
 'snapshot',(select to_jsonb(s) from avespet_infra.samples s where collected_at>=start_br and collected_at<end_br order by collected_at desc limit 1),
 'snapshot_first',(select to_jsonb(s) from avespet_infra.samples s where collected_at>=start_br and collected_at<end_br order by collected_at limit 1),
 'sample_count',(select count(*) from avespet_infra.samples where collected_at>=start_br and collected_at<end_br),
 'new_accounts_currently_present',(select count(*) from auth.users where created_at>=start_br and created_at<end_br),
 'traffic',(select jsonb_build_object('views',sum(total),'days',count(distinct dia),'routes',count(distinct caminho),'first_day',min(dia),'last_day',max(dia)) from public.visitas_diarias where dia>=m and dia<next_month),
 'ia',(select jsonb_build_object('first_day',min(day),'last_day',max(day),'responses',sum(calls) filter(where outcome='success'),'provider_calls',sum(calls) filter(where outcome in ('success','empty','provider_error','provider_limit','network')),'metered_calls',sum(metered_calls),'tokens_total',case when sum(metered_calls)>0 then sum(total_tokens) end,'failures',sum(calls) filter(where outcome in ('empty','provider_error','provider_limit','network'))) from avespet_infra.ia_daily where day>=m and day<next_month),
 'ia_reserved',(select sum(quantidade) from public.avespet_ia_consumo where escopo='global' and janela like 'd:'||to_char(m,'YYYY-MM')||'-%'),
 'email',(with events as (
 select status,provider_id,created_at,sent_at as accepted_at from public.aves_perdidas_emails_aprovacao
 union all select status,provider_id,created_at,sent_at from public.email_reengagement_delivery
 union all select status,provider_id,created_at,attempted_at from avespet_infra.alert_outbox
 ), accepted as (select distinct on(provider_id) provider_id,accepted_at from events where status='sent' and provider_id is not null and provider_id<>'' and accepted_at is not null order by provider_id,accepted_at)
 select jsonb_build_object('accepted',(select count(*) from accepted where accepted_at>=start_br and accepted_at<end_br),'failed',(select count(*) from events where status='failed' and created_at>=start_br and created_at<end_br))),
 'health',(select coalesce(jsonb_agg(to_jsonb(h) order by h.target),'[]'::jsonb) from (select target,count(*) filter(where outcome in ('ok','failed')) as measured,count(*) filter(where outcome='ok') as successful,count(*) filter(where outcome in ('unknown','pending')) as unknown,min(requested_at) as first_probe,max(requested_at) as last_probe from avespet_infra.health_checks where requested_at>=start_br and requested_at<end_br group by target) h),
 'budget',(select to_jsonb(b)||jsonb_build_object('forecast_total_cents',(select sum(value::bigint) from jsonb_each_text(b.forecasts) where value is not null),'confirmed_total_cents',(select sum(value::bigint) from jsonb_each_text(b.confirmed) where value is not null),'forecast_complete',(select count(value)=5 from jsonb_each_text(b.forecasts)),'confirmed_complete',(select count(value)=5 from jsonb_each_text(b.confirmed))) from avespet_infra.monthly_budget b where b.month_start=m));
end $$;
revoke all on function public.master_infra_monthly_report(uuid,date) from public,anon,authenticated;
grant execute on function public.master_infra_monthly_report(uuid,date) to service_role;
