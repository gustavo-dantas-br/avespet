-- AVESPET IA | proposta de migração (NÃO aplicada em produção)
-- Revisada em 2026-11-19 a partir da tabela public.aves existente.
-- Executar somente após revisão e aprovação, com teste prévio de RLS.

create table if not exists public.avespet_ia_diario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ave_id uuid not null references public.aves(id) on delete cascade,
  data_registro date not null,
  peso_gramas numeric(8,2) check (peso_gramas > 0 and peso_gramas <= 10000),
  fase_alimentar text not null default 'nao_informada'
    check (fase_alimentar in ('nao_informada','assistida','transicao','independente')),
  observacoes text not null default ''
    check (char_length(observacoes) <= 500),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint diario_tem_conteudo check (peso_gramas is not null or length(btrim(observacoes)) > 0),
  constraint diario_data_valida check (data_registro >= date '2000-01-01')
);
create index if not exists avespet_ia_diario_user_ave_data_idx
 on public.avespet_ia_diario (user_id, ave_id, data_registro desc);

alter table public.avespet_ia_diario enable row level security;
revoke all on public.avespet_ia_diario from public, anon, authenticated;
grant select, insert, update, delete on public.avespet_ia_diario to authenticated;
-- Não permitir escolha arbitrária de proprietários: a ave também deve pertencer ao usuário.
-- Aplicado tanto à leitura como à gravação. Privacidade por ave/user.
create policy "avespet_ia_diario_select_own" on public.avespet_ia_diario
 for select to authenticated using (
  user_id = (select auth.uid())
  and exists (select 1 from public.aves a where a.id = ave_id and a.user_id = (select auth.uid()))
 );
create policy "avespet_ia_diario_insert_own" on public.avespet_ia_diario
 for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.aves a where a.id = ave_id and a.user_id = (select auth.uid()))
 );
create policy "avespet_ia_diario_update_own" on public.avespet_ia_diario
 for update to authenticated using (
  user_id = (select auth.uid())
  and exists (select 1 from public.aves a where a.id = ave_id and a.user_id = (select auth.uid()))
 ) with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.aves a where a.id = ave_id and a.user_id = (select auth.uid()))
 );
create policy "avespet_ia_diario_delete_own" on public.avespet_ia_diario
 for delete to authenticated using (
  user_id = (select auth.uid())
  and exists (select 1 from public.aves a where a.id = ave_id and a.user_id = (select auth.uid()))
 );

-- Auditoria de segurança pendente: testar com usuários distintos, sem usar service_role no cliente.
-- Não executar automaticamente esta proposta; aplicar com nome de migração versionada via CLI.
