-- Registro idempotente de boas-vindas após confirmação de e-mail.
begin;
create table if not exists public.email_welcome_delivery (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  status text not null check (status in ('processing','sent','failed','uncertain')),
  provider_id text,
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.email_welcome_delivery enable row level security;
revoke all on public.email_welcome_delivery from anon, authenticated;
grant all on public.email_welcome_delivery to service_role;
commit;
