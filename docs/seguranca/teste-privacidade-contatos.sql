\set ON_ERROR_STOP on
-- Banco descartável exclusivo do CI; nunca execute em produção.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated;
create table public.perfil_criador(user_id uuid primary key,data jsonb not null);
create table public.anuncios(user_id uuid not null,ativo boolean not null,status text not null);
create table public.admins(user_id uuid primary key);
alter table public.perfil_criador enable row level security;
alter table public.anuncios enable row level security;
alter table public.admins enable row level security;
grant select on public.perfil_criador,public.anuncios,public.admins to anon,authenticated;
grant insert,update on public.perfil_criador to authenticated;
create policy "qualquer um pode ver o perfil publico" on public.perfil_criador for select using(true);
create policy owner_select on public.perfil_criador for select using(auth.uid()=user_id);
create policy owner_update on public.perfil_criador for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy owner_insert on public.perfil_criador for insert with check(auth.uid()=user_id);
create policy approved on public.anuncios for select using(ativo and status='aprovado');
create policy own_admin on public.admins for select using(auth.uid()=user_id);
insert into public.perfil_criador values
('00000000-0000-0000-0000-000000000001','{"nomeCriatorio":"Teste A","whatsapp":"11111111111","nomeCompleto":"Privado A","whatsappComercial":"11987654321","autorizaWhatsappComercial":true}'),
('00000000-0000-0000-0000-000000000002','{"nomeCriatorio":"Teste B","whatsapp":"22222222222"}'),
('00000000-0000-0000-0000-000000000003','{"nomeCriatorio":"Teste C","whatsappComercial":"11912345678","autorizaWhatsappComercial":true}'),
('00000000-0000-0000-0000-000000000004','{"nomeCriatorio":"Teste D","whatsapp":"33333333333"}');
insert into public.anuncios values ('00000000-0000-0000-0000-000000000001',true,'aprovado'),('00000000-0000-0000-0000-000000000003',true,'pendente'),('00000000-0000-0000-0000-000000000004',true,'aprovado');
insert into public.admins values ('00000000-0000-0000-0000-000000000099');
\ir privacidade-contatos-proposta.sql
-- Ativa fase 2 EXCLUSIVAMENTE neste banco descartável.
create policy "moderador consulta perfis" on public.perfil_criador for select to authenticated using(exists(select 1 from public.admins a where a.user_id=(select auth.uid())));
drop policy "qualquer um pode ver o perfil publico" on public.perfil_criador;
revoke select on public.perfil_criador from anon;
set role anon;
do $$ begin
 if (select count(*) from public.perfis_comerciais_publicos) <> 2 then raise exception 'vitrine: escopo incorreto'; end if;
 if exists(select 1 from public.perfis_comerciais_publicos where data ? 'nomeCompleto' or data ? 'whatsappComercial' or data->>'whatsapp' in ('11111111111','22222222222','33333333333')) then raise exception 'dados privados vazaram'; end if;
 if not exists(select 1 from public.perfis_comerciais_publicos where data->>'whatsapp'='11987654321') then raise exception 'telefone autorizado ausente'; end if;
 begin perform 1 from public.perfil_criador; raise exception 'anon leu perfil'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$ begin
 if (select count(*) from public.perfil_criador) <> 1 then raise exception 'titular leu outro perfil'; end if;
 if not exists(select 1 from public.perfil_criador where data->>'whatsapp'='11111111111') then raise exception 'telefone pessoal perdido'; end if;
 begin update public.perfis_comerciais_publicos set data='{}'; raise exception 'escrita publica'; exception when insufficient_privilege then null; end;
end $$;
update public.perfil_criador set data=jsonb_set(data,'{autorizaWhatsappComercial}','false');
reset role;
set role anon;
do $$ begin
 if exists(select 1 from public.perfis_comerciais_publicos where data->>'whatsapp'<>'') then raise exception 'revogacao falhou'; end if;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000099',false);
do $$ begin
 if (select count(*) from public.perfil_criador) <> 4 then raise exception 'moderador sem acesso'; end if;
end $$;
reset role;
select 'OK: testes de isolamento, autorizacao e revogacao' as resultado;
