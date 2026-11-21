-- Proposta NÃO aplicada. Validar em ambiente isolado com duas contas antes de habilitar.
create table public.avespet_ia_perfis (
 user_id uuid primary key references auth.users(id) on delete cascade,
 ave_id uuid references public.aves(id) on delete set null,
 nivel text not null default 'iniciante' check(nivel in ('iniciante','intermediario','experiente')),
 dados_educativos jsonb not null default '{}'::jsonb check(jsonb_typeof(dados_educativos)='object' and octet_length(dados_educativos::text)<=4096),
 atualizado_em timestamptz not null default now()
);
alter table public.avespet_ia_perfis enable row level security;
revoke all on public.avespet_ia_perfis from anon, authenticated;
grant select,insert,update,delete on public.avespet_ia_perfis to authenticated;
create policy perfil_ia_select on public.avespet_ia_perfis for select to authenticated using(user_id=(select auth.uid()) and (ave_id is null or exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid()))));
create policy perfil_ia_insert on public.avespet_ia_perfis for insert to authenticated with check(user_id=(select auth.uid()) and (ave_id is null or exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid()))));
create policy perfil_ia_update on public.avespet_ia_perfis for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and (ave_id is null or exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid()))));
create policy perfil_ia_delete on public.avespet_ia_perfis for delete to authenticated using(user_id=(select auth.uid()));
-- Sem alteração na tabela aves e sem sincronização automática até os testes RLS serem aprovados.
