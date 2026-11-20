-- Avespet: infraestrutura. Aplicar antes de publicar a interface.
create schema if not exists avespet_infra;
revoke all on schema avespet_infra from public, anon, authenticated;
create table if not exists avespet_infra.samples (
  collected_at timestamptz primary key default now(),
  database_bytes bigint not null,
  storage_bytes bigint not null,
  files_total bigint not null,
  users_total bigint not null,
  users_signed_in_30d bigint not null
);
alter table avespet_infra.samples enable row level security;
revoke all on avespet_infra.samples from public, anon, authenticated;
create or replace function avespet_infra.collect()
returns void language plpgsql security invoker set search_path = '' as $$
begin
  insert into avespet_infra.samples(database_bytes,storage_bytes,files_total,users_total,users_signed_in_30d)
  select pg_catalog.pg_database_size(pg_catalog.current_database()),
    (select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end),0) from storage.objects),
    (select count(*) from storage.objects),
    (select count(*) from auth.users),
    (select count(*) from auth.users where last_sign_in_at >= now()-interval '30 days');
  delete from avespet_infra.samples where collected_at < now()-interval '180 days';
end $$;
revoke all on function avespet_infra.collect() from public, anon, authenticated;
-- Only server role can read/refresh; the Edge Function checks Master entitlement.
create or replace function public.master_infra_snapshot(p_refresh boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_refresh and not exists(select 1 from avespet_infra.samples where collected_at > now()-interval '5 minutes') then
    if pg_catalog.pg_try_advisory_xact_lock(73919213) then
      if not exists(select 1 from avespet_infra.samples where collected_at > now()-interval '5 minutes') then
        perform avespet_infra.collect();
      end if;
    end if;
  end if;
  return jsonb_build_object('latest',(select to_jsonb(s) from avespet_infra.samples s order by collected_at desc limit 1),
    'history',coalesce((select jsonb_agg(to_jsonb(h) order by h.collected_at) from (
      select distinct on ((collected_at at time zone 'America/Sao_Paulo')::date) *
      from avespet_infra.samples where collected_at >= now()-interval '30 days'
      order by (collected_at at time zone 'America/Sao_Paulo')::date, collected_at desc
    ) h),'[]'::jsonb));
end $$;
revoke all on function public.master_infra_snapshot(boolean) from public, anon, authenticated;
grant execute on function public.master_infra_snapshot(boolean) to service_role;
select avespet_infra.collect();
select cron.schedule('avespet-infra-six-hourly','17 */6 * * *','select avespet_infra.collect()');
