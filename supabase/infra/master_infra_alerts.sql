-- Infra alert outbox: private, no recipient data in source.
-- Install only after review. Sending is explicitly opt-in.
create table if not exists avespet_infra.alert_state (
 metric text primary key check(metric in ('database','storage')),
 level int not null check(level between 0 and 3)
);
create table if not exists avespet_infra.alert_outbox (
 id uuid primary key default gen_random_uuid(),
 metric text not null check(metric in ('database','storage')),
 level int not null check(level between 0 and 3),
 pct numeric not null,
 created_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','sending','sent','failed','uncertain','superseded')),
 attempted_at timestamptz,
 provider_id text,
 unique(metric,created_at)
);
alter table avespet_infra.alert_state enable row level security;
alter table avespet_infra.alert_outbox enable row level security;
revoke all on avespet_infra.alert_state,avespet_infra.alert_outbox from public,anon,authenticated;
create or replace function avespet_infra.evaluate_alerts()
returns void language plpgsql security invoker set search_path='' as $$
declare s avespet_infra.samples%rowtype; m record; old_level int; new_level int;
begin
 if not pg_catalog.pg_try_advisory_xact_lock(73919214) then return; end if;
 select * into s from avespet_infra.samples order by collected_at desc limit 1;
 if not found or s.collected_at < now()-interval '7 hours' then return; end if;
 for m in select * from (values ('database',s.database_bytes::numeric/500000000*100),('storage',s.storage_bytes::numeric/1000000000*100)) as x(metric,pct) loop
   select level into old_level from avespet_infra.alert_state where metric=m.metric;
   old_level:=coalesce(old_level,0);
   new_level:=case when m.pct>=90 then 3 when m.pct>=70 then 2 when m.pct>=50 then 1 else 0 end;
   -- Two percentage points of hysteresis on the way down.
   if new_level<old_level and m.pct>=case old_level when 3 then 88 when 2 then 68 else 48 end then new_level:=old_level; end if;
   if new_level<>old_level then
     update avespet_infra.alert_outbox set status='superseded' where metric=m.metric and status='pending';
     if new_level>old_level or new_level=0 then
       insert into avespet_infra.alert_outbox(metric,level,pct) values(m.metric,new_level,round(m.pct,2));
     end if;
   end if;
   insert into avespet_infra.alert_state(metric,level) values(m.metric,new_level)
   on conflict(metric) do update set level=excluded.level;
 end loop;
 -- A network timeout is ambiguous; never silently retry old attempts.
 update avespet_infra.alert_outbox set status='uncertain' where status='sending' and attempted_at<now()-interval '15 minutes';
end $$;
revoke all on function avespet_infra.evaluate_alerts() from public,anon,authenticated;
create or replace function public.master_infra_claim_alert()
returns jsonb language plpgsql security definer set search_path='' as $$
declare item avespet_infra.alert_outbox%rowtype;
begin
 select * into item from avespet_infra.alert_outbox where status='pending' order by created_at for update skip locked limit 1;
 if not found then return null; end if;
 update avespet_infra.alert_outbox set status='sending',attempted_at=now() where id=item.id;
 return to_jsonb(item);
end $$;
create or replace function public.master_infra_finish_alert(p_id uuid,p_status text,p_provider_id text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_status not in ('sent','failed','uncertain') then raise exception 'Invalid status'; end if;
 update avespet_infra.alert_outbox set status=p_status,provider_id=left(p_provider_id,100) where id=p_id and status='sending';
end $$;
revoke all on function public.master_infra_claim_alert(),public.master_infra_finish_alert(uuid,text,text) from public,anon,authenticated;
grant execute on function public.master_infra_claim_alert(),public.master_infra_finish_alert(uuid,text,text) to service_role;
-- Evaluation follows regular collection; no automatic dispatch until configured separately.
select cron.schedule('avespet-infra-alert-evaluation','27 */6 * * *','select avespet_infra.evaluate_alerts()');
select avespet_infra.evaluate_alerts();
