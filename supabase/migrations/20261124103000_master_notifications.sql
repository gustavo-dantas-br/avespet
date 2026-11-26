create table if not exists public.master_notifications (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  category text not null check (category in ('support','email','moderation','infrastructure','account')),
  title text not null,
  message text not null default '',
  priority text not null default 'normal' check (priority in ('normal','high','critical')),
  target_section text not null,
  source_created_at timestamptz not null default now(),
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists master_notifications_active_idx on public.master_notifications (created_at desc) where archived_at is null;
alter table public.master_notifications enable row level security;
revoke all on public.master_notifications from anon, authenticated;
grant all on public.master_notifications to service_role;
comment on table public.master_notifications is 'Central exclusiva Master; acesso via Edge Function com validação de master_admins.';
