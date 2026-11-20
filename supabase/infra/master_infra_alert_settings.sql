-- Master-only configuration access; audit and update in the same transaction.
create or replace function public.master_infra_alert_settings(p_actor uuid,p_recipient text default null,p_enabled boolean default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg avespet_infra.dispatch_config%rowtype;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_recipient is not null or p_enabled is not null then
  if p_recipient is null or p_enabled is null or length(p_recipient)>254 or p_recipient !~ '^[^[:space:]@,;]+@[^[:space:]@,;]+\.[^[:space:]@,;]+$' then raise exception 'Invalid configuration'; end if;
  update avespet_infra.dispatch_config set recipient=lower(trim(p_recipient)),enabled=p_enabled where singleton;
  insert into public.master_audit_log(actor_user_id,action,resource_type,metadata)
  values(p_actor,'infra_alert_settings_updated','platform',jsonb_build_object('enabled',p_enabled));
 end if;
 select * into cfg from avespet_infra.dispatch_config where singleton;
 return jsonb_build_object('enabled',cfg.enabled,'recipient',cfg.recipient,'recent',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select metric,level,pct,status,created_at from avespet_infra.alert_outbox order by created_at desc limit 20) x),'[]'::jsonb));
end $$;
revoke all on function public.master_infra_alert_settings(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.master_infra_alert_settings(uuid,text,boolean) to service_role;
