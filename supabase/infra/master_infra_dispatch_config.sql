-- Configuration is private. No email or scheduler secret in source.
create table if not exists avespet_infra.dispatch_config (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 recipient text,
 scheduler_sha256 text not null check(scheduler_sha256 ~ '^[0-9a-f]{64}$')
);
alter table avespet_infra.dispatch_config enable row level security;
revoke all on avespet_infra.dispatch_config from public,anon,authenticated;
do $$
declare token text;
begin
 if not exists(select 1 from avespet_infra.dispatch_config) then
  token:=encode(extensions.gen_random_bytes(32),'hex');
  perform vault.create_secret(token,'avespet_infra_scheduler','Dedicated infra scheduler');
  insert into avespet_infra.dispatch_config(scheduler_sha256) values(encode(extensions.digest(token,'sha256'),'hex'));
 end if;
end $$;
create or replace function public.master_infra_dispatch_config(p_digest text)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('enabled',enabled,'recipient',recipient)
 from avespet_infra.dispatch_config where singleton and scheduler_sha256=p_digest
$$;
revoke all on function public.master_infra_dispatch_config(text) from public,anon,authenticated;
grant execute on function public.master_infra_dispatch_config(text) to service_role;
create or replace function avespet_infra.dispatch_tick()
returns bigint language plpgsql security invoker set search_path='' as $$
declare token text; request_id bigint;
begin
 if not exists(select 1 from avespet_infra.dispatch_config where enabled and recipient is not null) then return null; end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='avespet_infra_scheduler' limit 1;
 if token is null then return null; end if;
 select net.http_post(url:='https://tnnpzitijvklbnwptsuq.supabase.co/functions/v1/infra-alert-dispatch',headers:=jsonb_build_object('Content-Type','application/json','x-avespet-scheduler',token),body:='{}'::jsonb,timeout_milliseconds:=45000) into request_id;
 return request_id;
end $$;
revoke all on function avespet_infra.dispatch_tick() from public,anon,authenticated;
select cron.schedule('avespet-infra-alert-dispatch','37 */6 * * *','select avespet_infra.dispatch_tick()');
