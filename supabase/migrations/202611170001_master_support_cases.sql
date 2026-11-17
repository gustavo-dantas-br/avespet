-- Fila interna de atendimentos do Master, separada de e-mail e do registro original.
-- Preparação apenas: executar somente quando for publicada a nova tela.
create table if not exists public.master_support_cases (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('achado', 'perdida', 'campanha')),
  source_id uuid not null,
  status text not null default 'novo'
    check (status in ('novo', 'em_andamento', 'aguardando', 'concluido')),
  priority text not null default 'normal'
    check (priority in ('normal','alta','urgente')),
  assigned_to uuid references auth.users(id) on delete set null,
  internal_note text not null default '' check (char_length(internal_note) <= 2000),
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source,source_id)
);

create index if not exists master_support_cases_status_priority_idx
  on public.master_support_cases (status,priority,updated_at desc);
create index if not exists master_support_cases_assigned_to_idx
  on public.master_support_cases (assigned_to,updated_at desc);

-- Privilegios sao concedidos somente ao backend service_role.
alter table public.master_support_cases enable row level security;
revoke all on table public.master_support_cases from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.master_support_cases to service_role;

comment on table public.master_support_cases is
  'Acompanhamento operacional interno do Master, sem alterar os status de achados, campanhas ou aves perdidas.';
comment on column public.master_support_cases.internal_note is
  'Observacao interna e privada, sem envio de mensagens externas ou e-mails.';
