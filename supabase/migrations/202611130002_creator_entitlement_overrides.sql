-- Exceções individuais de recursos e limites concedidas pelo Painel Master.
-- Acesso exclusivo às Edge Functions com service role; não expor via Data API.
create table if not exists public.creator_entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  max_birds_override integer,
  unlimited_birds_override boolean not null default false,
  feature_overrides jsonb not null default '{}'::jsonb,
  note text not null default '',
  expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_entitlement_overrides_max_birds_check
    check (max_birds_override is null or max_birds_override >= 0),
  constraint creator_entitlement_overrides_unlimited_check
    check (not unlimited_birds_override or max_birds_override is null)
);

create index if not exists creator_entitlement_overrides_user_idx
  on public.creator_entitlement_overrides(user_id);
create index if not exists creator_entitlement_overrides_expiry_idx
  on public.creator_entitlement_overrides(expires_at);

alter table public.creator_entitlement_overrides enable row level security;
revoke all on table public.creator_entitlement_overrides from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.creator_entitlement_overrides to service_role;

comment on table public.creator_entitlement_overrides is
  'Exceções individuais concedidas pelo Master para limites e funcionalidades, sem alterar o plano contratado.';
comment on column public.creator_entitlement_overrides.feature_overrides is
  'Mapa parcial de permissões booleanas; chaves ausentes herdam o plano. Valores true ou false sobrescrevem o plano.';
comment on column public.creator_entitlement_overrides.expires_at is
  'Quando preenchido, a exceção deixa de valer automaticamente após esta data.';
