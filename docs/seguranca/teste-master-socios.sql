\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create table public.master_admins(user_id uuid primary key references auth.users(id),created_at timestamptz default now());
create table public.master_audit_log(id bigint generated always as identity primary key,actor_user_id uuid,action text,resource_type text,resource_id text,metadata jsonb,created_at timestamptz default now());
alter table public.master_admins enable row level security;
alter table public.master_audit_log enable row level security;
grant usage on schema auth to service_role;
grant all on public.master_admins,public.master_audit_log to service_role;
grant usage,select on all sequences in schema public to service_role;
grant select,insert,update,delete on public.master_admins to authenticated,anon;
insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002'),('00000000-0000-4000-8000-000000000003');
insert into public.master_admins(user_id) values ('00000000-0000-4000-8000-000000000001');
\ir master-socios-proposta.sql
do $test$
begin
 if has_table_privilege('service_role','auth.users','SELECT') then raise exception 'Acesso desnecessario ao Auth'; end if;
 if has_function_privilege('anon','public.master_alterar_acesso(uuid,uuid,boolean,text)','execute') or has_function_privilege('authenticated','public.master_alterar_acesso(uuid,uuid,boolean,text)','execute') then raise exception 'RPC exposta'; end if;
 if has_table_privilege('authenticated','public.master_admins','INSERT') or has_table_privilege('anon','public.master_admins','DELETE') then raise exception 'Escrita direta exposta'; end if;
 if (select count(*) from public.master_admins where papel='owner')<>1 then raise exception 'Bootstrap incorreto'; end if;
end $test$;
set role service_role;
select public.master_alterar_acesso('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',true,'Socio autorizado');
do $test$
begin
 begin
   perform public.master_alterar_acesso('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003',true,'Tentativa indevida');
   raise exception 'TESTE_FALHOU';
 exception when raise_exception then if sqlerrm='TESTE_FALHOU' then raise; end if; end;
 begin
   delete from public.master_admins where papel='owner';
   raise exception 'TESTE_FALHOU';
 exception when raise_exception then if sqlerrm='TESTE_FALHOU' then raise; end if; end;
 begin
   update public.master_admins set papel='master' where papel='owner';
   raise exception 'TESTE_FALHOU';
 exception when raise_exception then if sqlerrm='TESTE_FALHOU' then raise; end if; end;
end $test$;
select public.master_alterar_acesso('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',false,'Revogacao autorizada');
reset role;
do $test$
begin
 if (select count(*) from auth.users)<>3 then raise exception 'Contas alteradas'; end if;
 if (select count(*) from public.master_admins)<>1 then raise exception 'Permissoes incorretas'; end if;
 if (select count(*) from public.master_audit_log)<>2 then raise exception 'Auditoria incorreta'; end if;
end $test$;
set role service_role;
do $test$
begin
 begin
   perform public.master_alterar_acesso('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000009',true,'Conta inexistente');
   raise exception 'TESTE_FALHOU';
 exception when foreign_key_violation then null; end;
end $test$;
reset role;
-- Simula indisponibilidade da auditoria para comprovar rollback.
alter table public.master_audit_log add constraint reject_grants check(action <> 'master_access_granted') not valid;
set role service_role;
do $test$
begin
 begin
   perform public.master_alterar_acesso('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003',true,'Teste rollback');
   raise exception 'TESTE_FALHOU';
 exception when check_violation then null; end;
 if exists(select 1 from public.master_admins where user_id='00000000-0000-4000-8000-000000000003') then raise exception 'Concessao sem auditoria'; end if;
end $test$;
reset role;
select 'PASS: autorizacao, protecao, auditoria e preservacao' as resultado;
