-- Dispositivos autorizados a receber notificacoes push do Avespet.
-- A chave privada VAPID nunca deve ser armazenada nesta tabela.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device_label text,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint push_subscriptions_endpoint_not_empty check (length(trim(endpoint)) > 0),
  constraint push_subscriptions_p256dh_not_empty check (length(trim(p256dh)) > 0),
  constraint push_subscriptions_auth_not_empty check (length(trim(auth)) > 0)
);

create index if not exists idx_push_subscriptions_user_active
  on public.push_subscriptions (user_id)
  where revoked_at is null;

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can register own push subscriptions" on public.push_subscriptions;
create policy "Users can register own push subscriptions"
  on public.push_subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can revoke own push subscriptions" on public.push_subscriptions;
create policy "Users can revoke own push subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.push_subscriptions from anon, public;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
