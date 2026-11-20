-- Lançamento: fechado por padrão, somente service_role pode reservar chamadas.
create table if not exists public.avespet_ia_config (
 id boolean primary key default true check (id),
 liberacao_temporaria boolean not null default false,
 limite_usuario_dia integer not null default 5 check(limite_usuario_dia between 1 and 100),
 limite_usuario_mes integer not null default 30 check(limite_usuario_mes between 1 and 3000),
 limite_global_dia integer not null default 20 check(limite_global_dia between 1 and 10000),
 limite_global_minuto integer not null default 2 check(limite_global_minuto between 1 and 100)
);
insert into public.avespet_ia_config(id) values(true) on conflict do nothing;
alter table public.avespet_ia_config enable row level security;
revoke all on public.avespet_ia_config from public, anon, authenticated;
grant select on public.avespet_ia_config to service_role;
create table if not exists public.avespet_ia_consumo (
 escopo text not null, janela text not null, quantidade integer not null default 0 check(quantidade>=0), primary key(escopo,janela)
);
alter table public.avespet_ia_consumo enable row level security;
revoke all on public.avespet_ia_consumo from public, anon, authenticated;
create or replace function public.avespet_ia_reservar(p_usuario uuid, p_teste boolean default false)
returns text language plpgsql security definer set search_path = '' as $$
declare cfg public.avespet_ia_config%rowtype; dia text; mes text; minuto text; agora timestamp; u text;
begin
 if p_usuario is null then return 'SEM_ACESSO'; end if;
 perform pg_catalog.pg_advisory_xact_lock(78163201);
 select * into cfg from public.avespet_ia_config where id=true;
 if not found or (not cfg.liberacao_temporaria and not p_teste) then return 'SEM_ACESSO'; end if;
 agora := pg_catalog.timezone('America/Los_Angeles', pg_catalog.now());
 dia := 'd:' || pg_catalog.to_char(agora,'YYYY-MM-DD');
 mes := 'm:' || pg_catalog.to_char(agora,'YYYY-MM');
 minuto := 'min:' || pg_catalog.to_char(pg_catalog.timezone('UTC',pg_catalog.now()),'YYYY-MM-DD HH24:MI');
 u := 'u:' || p_usuario::text;
 if coalesce((select quantidade from public.avespet_ia_consumo where escopo=u and janela=dia),0)>=cfg.limite_usuario_dia or coalesce((select quantidade from public.avespet_ia_consumo where escopo=u and janela=mes),0)>=cfg.limite_usuario_mes then return 'LIMITE_USUARIO'; end if;
 if coalesce((select quantidade from public.avespet_ia_consumo where escopo='global' and janela=dia),0)>=cfg.limite_global_dia or coalesce((select quantidade from public.avespet_ia_consumo where escopo='global' and janela=minuto),0)>=cfg.limite_global_minuto then return 'LIMITE_GLOBAL'; end if;
 insert into public.avespet_ia_consumo(escopo,janela,quantidade) values (u,dia,1),(u,mes,1),('global',dia,1),('global',minuto,1) on conflict(escopo,janela) do update set quantidade=public.avespet_ia_consumo.quantidade+1;
 return 'OK';
end $$;
revoke all on function public.avespet_ia_reservar(uuid,boolean) from public, anon, authenticated;
grant execute on function public.avespet_ia_reservar(uuid,boolean) to service_role;