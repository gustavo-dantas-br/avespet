-- Registro de auditoria das operacoes do painel Master.
-- Nenhum acesso direto pelo navegador; escrita/leitura somente via Edge Function confiavel.
create table if not exists public.master_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists master_audit_log_created_at_idx
  on public.master_audit_log (created_at desc);
create index if not exists master_audit_log_actor_created_at_idx
  on public.master_audit_log (actor_user_id, created_at desc);

alter table public.master_audit_log enable row level security;
revoke all on table public.master_audit_log from public, anon, authenticated, service_role;
grant insert on table public.master_audit_log to service_role;
grant usage, select on sequence public.master_audit_log_id_seq to service_role;

comment on table public.master_audit_log is
  'Auditoria append-only das operacoes administrativas do Avespet Master; acesso exclusivo por operacoes server-side confiaveis.';
