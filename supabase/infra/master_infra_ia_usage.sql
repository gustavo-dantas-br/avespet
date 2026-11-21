-- Telemetria agregada do Gemini; nenhuma pergunta, resposta, chave ou usuário.
create table if not exists avespet_infra.ia_daily (
 day date not null, model text not null, outcome text not null,
 calls bigint not null default 0, metered_calls bigint not null default 0,
 input_tokens bigint not null default 0, output_tokens bigint not null default 0,
 thinking_tokens bigint not null default 0, total_tokens bigint not null default 0,
 primary key(day,model,outcome),
 check(outcome in ('success','empty','provider_limit','provider_error','network','user_limit','global_limit','local_limit')),
 check(calls>=0 and metered_calls between 0 and calls and input_tokens>=0 and output_tokens>=0 and thinking_tokens>=0 and total_tokens>=0)
);
alter table avespet_infra.ia_daily enable row level security;
revoke all on avespet_infra.ia_daily from public,anon,authenticated;
create or replace function public.master_infra_ia_record(p_model text,p_outcome text,p_input integer default null,p_output integer default null,p_thinking integer default null,p_total integer default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if length(p_model)>100 or p_model is null or p_model !~ '^[a-zA-Z0-9._-]+$' then raise exception 'Invalid model'; end if;
 if least(p_input,p_output,p_thinking,p_total)<0 or greatest(p_input,p_output,p_thinking,p_total)>10000000 then raise exception 'Invalid token count'; end if;
 insert into avespet_infra.ia_daily(day,model,outcome,calls,metered_calls,input_tokens,output_tokens,thinking_tokens,total_tokens)
 values((now() at time zone 'America/Los_Angeles')::date,p_model,p_outcome,1,case when p_total is not null then 1 else 0 end,coalesce(p_input,0),coalesce(p_output,0),coalesce(p_thinking,0),coalesce(p_total,0))
 on conflict(day,model,outcome) do update set calls=ia_daily.calls+1,metered_calls=ia_daily.metered_calls+excluded.metered_calls,input_tokens=ia_daily.input_tokens+excluded.input_tokens,output_tokens=ia_daily.output_tokens+excluded.output_tokens,thinking_tokens=ia_daily.thinking_tokens+excluded.thinking_tokens,total_tokens=ia_daily.total_tokens+excluded.total_tokens;
end $$;
revoke all on function public.master_infra_ia_record(text,text,integer,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.master_infra_ia_record(text,text,integer,integer,integer,integer) to service_role;
create or replace function public.master_infra_ia_summary(p_actor uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare today date :=(now() at time zone 'America/Los_Angeles')::date;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 return jsonb_build_object('day',today,'zone','America/Los_Angeles',
 'reserved_today',coalesce((select quantidade from public.avespet_ia_consumo where escopo='global' and janela='d:'||today::text),0),
 'reserved_month',coalesce((select sum(quantidade) from public.avespet_ia_consumo where escopo='global' and janela like 'd:'||to_char(today,'YYYY-MM')||'-%'),0),
 'limit_today',(select limite_global_dia from public.avespet_ia_config where id),
 'limit_minute',(select limite_global_minuto from public.avespet_ia_config where id),
 'first_day',(select min(day) from avespet_infra.ia_daily),
 'rows',coalesce((select jsonb_agg(to_jsonb(d) order by d.day desc) from avespet_infra.ia_daily d where d.day>=today-30),'[]'::jsonb));
end $$;
revoke all on function public.master_infra_ia_summary(uuid) from public,anon,authenticated;
grant execute on function public.master_infra_ia_summary(uuid) to service_role;
