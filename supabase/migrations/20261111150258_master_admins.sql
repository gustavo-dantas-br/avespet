-- Permissão exclusiva do painel Master do Avespet.
-- Nenhum usuário recebe acesso automaticamente: a inclusão é feita por operação administrativa confiável.
create table if not exists public.master_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.master_admins enable row level security;

drop policy if exists "master consulta sua propria permissao" on public.master_admins;
create policy "master consulta sua propria permissao"
  on public.master_admins
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.master_admins from public, anon, authenticated;
grant select on table public.master_admins to authenticated, service_role;

comment on table public.master_admins is
  'Lista de identidades autorizadas ao painel Master. Gerenciada somente por operações administrativas confiáveis; nunca pelo cliente.';
