-- Avespet: anúncios públicos gratuitos de aves perdidas.
-- Execute no SQL Editor do Supabase. Não altera a tabela antiga "perdidas".
create table if not exists public.anuncios_aves_perdidas (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado','encerrado')),
  created_at timestamptz not null default now()
);

create index if not exists anuncios_aves_perdidas_status_data_idx
  on public.anuncios_aves_perdidas (status, created_at desc);

alter table public.anuncios_aves_perdidas enable row level security;

drop policy if exists "publico le anuncios aprovados de aves perdidas" on public.anuncios_aves_perdidas;
create policy "publico le anuncios aprovados de aves perdidas"
  on public.anuncios_aves_perdidas for select
  to anon, authenticated
  using (status = 'aprovado');

drop policy if exists "publico envia anuncio pendente de ave perdida" on public.anuncios_aves_perdidas;
create policy "publico envia anuncio pendente de ave perdida"
  on public.anuncios_aves_perdidas for insert
  to anon, authenticated
  with check (status = 'pendente');

drop policy if exists "admin consulta todos anuncios de aves perdidas" on public.anuncios_aves_perdidas;
create policy "admin consulta todos anuncios de aves perdidas"
  on public.anuncios_aves_perdidas for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admin modera anuncios de aves perdidas" on public.anuncios_aves_perdidas;
create policy "admin modera anuncios de aves perdidas"
  on public.anuncios_aves_perdidas for update
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

grant select, insert on public.anuncios_aves_perdidas to anon, authenticated;
grant update on public.anuncios_aves_perdidas to authenticated;
