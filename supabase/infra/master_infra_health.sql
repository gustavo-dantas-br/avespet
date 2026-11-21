-- Sondas HTTP somente leitura, sem credenciais ou envio de mensagens.
create table if not exists avespet_infra.health_checks(
 id bigint generated always as identity primary key,
 target text not null check(target in ('site','auth_gateway','rest_gateway')),
 request_id bigint not null unique, requested_at timestamptz not null default clock_timestamp(),
 completed_at timestamptz, status_code integer,
 outcome text not null default 'pending' check(outcome in ('pending','ok','failed','unknown')),
 elapsed_ms integer check(elapsed_ms>=0)
);
alter table avespet_infra.health_checks enable row level security;
revoke all on avespet_infra.health_checks from public,anon,authenticated;
create index if not exists health_checks_target_time_idx on avespet_infra.health_checks(target,requested_at desc);
create or replace function avespet_infra.health_enqueue()
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not pg_try_advisory_xact_lock(78163203) then return; end if;
 if exists(select 1 from avespet_infra.health_checks where requested_at>now()-interval '10 minutes') then return; end if;
 insert into avespet_infra.health_checks(target,request_id) values
 ('site',net.http_get(url:='https://www.avespet.com.br/',timeout_milliseconds:=8000)),
 ('auth_gateway',net.http_get(url:='https://tnnpzitijvklbnwptsuq.supabase.co/auth/v1/health',timeout_milliseconds:=8000)),
 ('rest_gateway',net.http_get(url:='https://tnnpzitijvklbnwptsuq.supabase.co/rest/v1/',timeout_milliseconds:=8000));
end $$;
create or replace function avespet_infra.health_collect()
returns void language plpgsql security invoker set search_path='' as $$
begin
 update avespet_infra.health_checks h set
 completed_at=r.created,status_code=r.status_code,
 elapsed_ms=greatest(0,least(600000,round(extract(epoch from (r.created-h.requested_at))*1000)))::integer,
 outcome=case when coalesce(r.timed_out,false) or r.error_msg is not null then 'failed'
 when h.target='site' and r.status_code=200 and r.content like '%Avespet%' then 'ok'
 when h.target in ('auth_gateway','rest_gateway') and r.status_code=401 then 'ok'
 else 'failed' end
 from net._http_response r where h.request_id=r.id and h.outcome='pending';
 update avespet_infra.health_checks set outcome='unknown',completed_at=now() where outcome='pending' and requested_at<now()-interval '5 minutes';
 delete from avespet_infra.health_checks where requested_at<now()-interval '90 days';
end $$;
revoke all on function avespet_infra.health_enqueue(),avespet_infra.health_collect() from public,anon,authenticated;
create or replace function public.master_infra_health_summary(p_actor uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 return jsonb_build_object('collected_at',now(),'interval_minutes',15,'scope','internal_http_probes','targets',(
 select jsonb_agg(jsonb_build_object('target',t.target,'latest',(select to_jsonb(h)-'request_id'-'id' from avespet_infra.health_checks h where h.target=t.target and h.outcome<>'pending' order by h.requested_at desc limit 1),
 'checks_24h',(select count(*) from avespet_infra.health_checks h where h.target=t.target and h.requested_at>=now()-interval '24 hours' and h.outcome in ('ok','failed')),
 'ok_24h',(select count(*) from avespet_infra.health_checks h where h.target=t.target and h.requested_at>=now()-interval '24 hours' and h.outcome='ok'),
 'unknown_24h',(select count(*) from avespet_infra.health_checks h where h.target=t.target and h.requested_at>=now()-interval '24 hours' and h.outcome in ('unknown','pending')),
 'avg_ms_24h',(select round(avg(elapsed_ms)) from avespet_infra.health_checks h where h.target=t.target and h.requested_at>=now()-interval '24 hours' and h.outcome='ok'),
 'recent',(select coalesce(jsonb_agg(to_jsonb(r)-'request_id'-'id' order by r.requested_at desc),'[]'::jsonb) from (select * from avespet_infra.health_checks h where h.target=t.target and h.outcome<>'pending' order by requested_at desc limit 12) r)
 ) order by t.target) from (values ('site'),('auth_gateway'),('rest_gateway')) t(target)));
end $$;
revoke all on function public.master_infra_health_summary(uuid) from public,anon,authenticated;
grant execute on function public.master_infra_health_summary(uuid) to service_role;
select cron.schedule('avespet-infra-health-enqueue','2,17,32,47 * * * *','select avespet_infra.health_enqueue()');
select cron.schedule('avespet-infra-health-collect','3,18,33,48 * * * *','select avespet_infra.health_collect()');
