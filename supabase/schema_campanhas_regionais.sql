-- Campanhas regionais avulsas para divulgação de aves perdidas.
-- Execute no Supabase SQL Editor apenas uma vez.
create table if not exists public.solicitacoes_campanhas_aves (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid null references public.anuncios_aves_perdidas(id) on delete set null,
  pacote text not null check (pacote in ('bairro', 'cidade', 'regional')),
  nome_contato text not null,
  whatsapp text not null,
  email text null,
  cidade text not null,
  uf text not null check (char_length(uf) = 2),
  area_alvo text not null,
  descricao_ave text not null default '',
  status text not null default 'solicitada'
    check (status in ('solicitada', 'em_orcamento', 'aguardando_pagamento', 'paga', 'em_execucao', 'concluida', 'cancelada')),
  valor numeric(10,2) null check (valor is null or valor >= 0),
  observacoes_admin text not null default '',
  created_at timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists solicitacoes_campanhas_aves_status_data_idx
  on public.solicitacoes_campanhas_aves(status, created_at desc);

alter table public.solicitacoes_campanhas_aves enable row level security;

drop policy if exists "publico solicita campanha" on public.solicitacoes_campanhas_aves;
create policy "publico solicita campanha"
  on public.solicitacoes_campanhas_aves
  for insert to anon, authenticated
  with check (
    status = 'solicitada'
    and valor is null
    and observacoes_admin = ''
    and char_length(trim(nome_contato)) between 2 and 100
    and char_length(trim(whatsapp)) between 8 and 20
    and char_length(trim(cidade)) between 2 and 80
    and char_length(trim(uf)) = 2
    and char_length(trim(area_alvo)) between 2 and 240
    and char_length(coalesce(descricao_ave, '')) <= 1000
    and (email is null or char_length(email) <= 150)
  );

drop policy if exists "admins gerenciam campanhas" on public.solicitacoes_campanhas_aves;
create policy "admins gerenciam campanhas"
  on public.solicitacoes_campanhas_aves
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

grant insert on public.solicitacoes_campanhas_aves to anon, authenticated;
grant select, update on public.solicitacoes_campanhas_aves to authenticated;
