-- Controle administrativo exclusivo do servidor. Grava configuração e auditoria atomicamente.
create or replace function public.avespet_ia_master_configurar(p_actor uuid,p_config jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare anterior jsonb; posterior jsonb;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden'; end if;
 perform pg_catalog.pg_advisory_xact_lock(78163201);
 select pg_catalog.to_jsonb(c) into anterior from public.avespet_ia_config c where id=true;
 if anterior is null then raise exception 'Configuração ausente'; end if;
 if pg_catalog.jsonb_typeof(p_config->'liberacao_temporaria') is distinct from 'boolean' then raise exception 'Promoção inválida'; end if;
 if (p_config->>'limite_usuario_dia')::integer not between 1 and 5 or (p_config->>'limite_usuario_mes')::integer not between 1 and 30 or (p_config->>'limite_global_dia')::integer not between 1 and 20 or (p_config->>'limite_global_minuto')::integer not between 1 and 2 then raise exception 'Limite acima do teto'; end if;
 update public.avespet_ia_config set liberacao_temporaria=(p_config->>'liberacao_temporaria')::boolean,limite_usuario_dia=(p_config->>'limite_usuario_dia')::integer,limite_usuario_mes=(p_config->>'limite_usuario_mes')::integer,limite_global_dia=(p_config->>'limite_global_dia')::integer,limite_global_minuto=(p_config->>'limite_global_minuto')::integer where id=true;
 select pg_catalog.to_jsonb(c) into posterior from public.avespet_ia_config c where id=true;
 insert into public.master_audit_log(actor_user_id,action,resource_type,metadata) values(p_actor,'avespet_ia_config_updated','avespet_ia_config',pg_catalog.jsonb_build_object('anterior',anterior,'posterior',posterior));
end $$;
revoke all on function public.avespet_ia_master_configurar(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.avespet_ia_master_configurar(uuid,jsonb) to service_role;
grant update on public.avespet_ia_config to service_role;
