-- RASCUNHO NÃO APLICADO: revisão obrigatória antes de migrations, rollout e cobrança.
-- Supabase/PostgreSQL: somente backend service_role poderá criar/alterar pedidos,
-- pagamentos, eventos e gastos. Nunca dar INSERT/UPDATE ao cliente autenticado.
-- Não altera tabelas legadas de anúncios ou solicitações.
begin;

create table if not exists public.impulsionamento_pedidos (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references auth.users(id) on delete restrict,
  anuncio_id uuid not null references public.anuncios_aves_perdidas(id) on delete restrict,
  plano_codigo text not null check (plano_codigo in ('destaque','local','regional','intensiva')),
  plano_nome text not null,
  preco_centavos bigint not null check (preco_centavos > 0),
  verba_midia_centavos bigint not null check (verba_midia_centavos >= 0 and verba_midia_centavos <= preco_centavos),
  gestao_centavos bigint generated always as (preco_centavos - verba_midia_centavos) stored,
  moeda text not null default 'BRL' check (moeda = 'BRL'),
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento','pagamento_confirmado','em_analise','aprovado','ativo','pausado','concluido','cancelado','reembolsado')),
  asaas_checkout_id text unique,
  asaas_payment_id text unique,
  consentimento_versao text not null,
  consentimento_em timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists impulsionamento_pedidos_tutor_idx on public.impulsionamento_pedidos(tutor_id, created_at desc);
create index if not exists impulsionamento_pedidos_anuncio_idx on public.impulsionamento_pedidos(anuncio_id);

create table if not exists public.impulsionamento_pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.impulsionamento_pedidos(id) on delete restrict,
  provedor text not null default 'asaas' check (provedor = 'asaas'),
  payment_id text unique,
  valor_centavos bigint not null check (valor_centavos > 0),
  estado text not null default 'pendente' check (estado in ('pendente','confirmado','recebido','estornado','cancelado','falhou')),
  confirmado_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists impulsionamento_pagamentos_pedido_idx on public.impulsionamento_pagamentos(pedido_id);

create table if not exists public.impulsionamento_eventos_asaas (
  event_id text primary key, -- idempotência: mesmo evento não pode ser aplicado duas vezes
  event_type text not null,
  payment_id text,
  payload jsonb not null,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  erro_processamento text
);
create index if not exists impulsionamento_eventos_payment_idx on public.impulsionamento_eventos_asaas(payment_id);

create table if not exists public.impulsionamento_midia_gastos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.impulsionamento_pedidos(id) on delete restrict,
  referencia_meta text,
  valor_centavos bigint not null check (valor_centavos >= 0),
  registrado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id)
);
create index if not exists impulsionamento_midia_pedido_idx on public.impulsionamento_midia_gastos(pedido_id);

create table if not exists public.impulsionamento_reembolsos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.impulsionamento_pedidos(id) on delete restrict,
  asaas_refund_id text unique,
  valor_centavos bigint not null check (valor_centavos > 0),
  estado text not null default 'solicitado' check (estado in ('solicitado','em_analise','efetivado','rejeitado')),
  motivo text not null,
  created_at timestamptz not null default now()
);
create index if not exists impulsionamento_reembolsos_pedido_idx on public.impulsionamento_reembolsos(pedido_id);

-- Defesas em profundidade: usuários só conseguem visualizar seus pedidos e resumos financeiros;
-- usuários e papel anon nunca criam/alteram status por PostgREST.
alter table public.impulsionamento_pedidos enable row level security;
alter table public.impulsionamento_pagamentos enable row level security;
alter table public.impulsionamento_eventos_asaas enable row level security;
alter table public.impulsionamento_midia_gastos enable row level security;
alter table public.impulsionamento_reembolsos enable row level security;

revoke all on public.impulsionamento_pedidos from anon, authenticated;
revoke all on public.impulsionamento_pagamentos from anon, authenticated;
revoke all on public.impulsionamento_eventos_asaas from anon, authenticated;
revoke all on public.impulsionamento_midia_gastos from anon, authenticated;
revoke all on public.impulsionamento_reembolsos from anon, authenticated;

grant select on public.impulsionamento_pedidos to authenticated;
grant select on public.impulsionamento_pagamentos to authenticated;
grant select on public.impulsionamento_midia_gastos to authenticated;
grant select on public.impulsionamento_reembolsos to authenticated;

create policy "tutor consulta seus pedidos" on public.impulsionamento_pedidos
for select to authenticated using (tutor_id = (select auth.uid()));
create policy "tutor consulta pagamentos dos seus pedidos" on public.impulsionamento_pagamentos
for select to authenticated using (exists (
  select 1 from public.impulsionamento_pedidos p where p.id = pedido_id and p.tutor_id = (select auth.uid())
));
create policy "tutor consulta gastos dos seus pedidos" on public.impulsionamento_midia_gastos
for select to authenticated using (exists (
  select 1 from public.impulsionamento_pedidos p where p.id = pedido_id and p.tutor_id = (select auth.uid())
));
create policy "tutor consulta reembolsos dos seus pedidos" on public.impulsionamento_reembolsos
for select to authenticated using (exists (
  select 1 from public.impulsionamento_pedidos p where p.id = pedido_id and p.tutor_id = (select auth.uid())
));
-- Eventos de webhook são confidenciais e não recebem políticas de leitura pública.

commit;
