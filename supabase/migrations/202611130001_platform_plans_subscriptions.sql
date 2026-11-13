-- AvesPet: catálogo de planos, assinaturas e histórico de pagamentos.
-- Esta migração é versionada na branch de desenvolvimento; não aplicar em produção
-- até revisão e autorização explícita.

create table if not exists public.platform_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'BRL',
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly', 'one_time')),
  max_birds integer,
  features jsonb not null default '{}'::jsonb,
  is_free boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_plans_free_price_check
    check (not is_free or price_cents = 0),
  constraint platform_plans_max_birds_check
    check (max_birds is null or max_birds >= 0)
);

create table if not exists public.creator_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.platform_plans(id) on delete restrict,
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_subscriptions_user_status_idx
  on public.creator_subscriptions(user_id, status, starts_at desc);
create index if not exists creator_subscriptions_plan_idx
  on public.creator_subscriptions(plan_id);

create table if not exists public.platform_payment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.creator_subscriptions(id) on delete set null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'BRL',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded', 'canceled')),
  payment_method text,
  external_reference text,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists platform_payment_records_user_created_idx
  on public.platform_payment_records(user_id, created_at desc);
create index if not exists platform_payment_records_subscription_idx
  on public.platform_payment_records(subscription_id);

alter table public.platform_plans enable row level security;
alter table public.creator_subscriptions enable row level security;
alter table public.platform_payment_records enable row level security;

-- Catálogo ativo pode ser consultado para apresentar opções aos criadores.
drop policy if exists "planos ativos visiveis" on public.platform_plans;
create policy "planos ativos visiveis"
  on public.platform_plans for select
  using (is_active = true);

-- Cada criador consulta somente a própria assinatura e seus pagamentos.
-- Escritas administrativas serão feitas exclusivamente por Edge Function
-- com validação de vínculo em master_admins e service role no servidor.
drop policy if exists "criador consulta propria assinatura" on public.creator_subscriptions;
create policy "criador consulta propria assinatura"
  on public.creator_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "criador consulta proprios pagamentos" on public.platform_payment_records;
create policy "criador consulta proprios pagamentos"
  on public.platform_payment_records for select
  using (auth.uid() = user_id);

-- Plano gratuito inicial: cadastro de até 10 aves e recursos essenciais.
insert into public.platform_plans
  (code, name, description, price_cents, currency, billing_interval, max_birds, features, is_free, is_active, sort_order)
values
  (
    'free',
    'Gratuito',
    'Plano inicial para conhecer e organizar o AvesPet.',
    0,
    'BRL',
    'monthly',
    10,
    jsonb_build_object(
      'basic_profile', true,
      'basic_bird_management', true,
      'basic_ads', true,
      'advanced_genetics', false,
      'reproduction_management', false,
      'financial_management', false,
      'campaigns', false,
      'after_sales', false
    ),
    true,
    true,
    0
  )
on conflict (code) do nothing;

comment on table public.platform_plans is
  'Catálogo de planos e permissões funcionais da plataforma AvesPet.';
comment on column public.platform_plans.max_birds is
  'Quantidade máxima de aves por criador; NULL representa ilimitado.';
comment on column public.platform_plans.features is
  'Mapa JSON de recursos liberados por plano; validação efetiva deve ocorrer no servidor.';
