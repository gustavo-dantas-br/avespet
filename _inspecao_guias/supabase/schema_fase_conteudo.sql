-- Guias e videos publicos + contador de visitas
-- Cria 2 tabelas novas (artigos, visitas_diarias) e 1 funcao (registrar_visita).
-- Nao altera nem apaga nada que ja existe. Depende da tabela 'admins' (schema_fase_aprovacoes.sql).

-- 1) Artigos: qualquer visitante le so os PUBLICADOS; so admin le rascunhos e escreve.
create table if not exists artigos (
  id uuid primary key,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  titulo text not null check (length(titulo) between 1 and 200),
  resumo text check (resumo is null or length(resumo) <= 400),
  corpo text not null check (length(corpo) between 1 and 60000),
  especie text not null default 'Geral' check (especie in ('Geral', 'Ring Neck', 'Calopsita')),
  categoria text check (categoria is null or length(categoria) <= 60),
  video_url text check (video_url is null or length(video_url) <= 300),
  publicado boolean not null default false,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table artigos enable row level security;

create policy "qualquer um le artigos publicados"
  on artigos for select using (publicado = true);

create policy "admin le todos os artigos"
  on artigos for select
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

create policy "admin escreve artigos"
  on artigos for all
  using (exists (select 1 from admins where admins.user_id = auth.uid()))
  with check (exists (select 1 from admins where admins.user_id = auth.uid()));

create index if not exists artigos_publicado_idx on artigos(publicado, publicado_em desc);


-- 2) Visitas: so contagem por pagina e por dia. Sem cookie, sem IP, sem dado pessoal.
create table if not exists visitas_diarias (
  dia date not null,
  caminho text not null,
  total integer not null default 0,
  primary key (dia, caminho)
);

alter table visitas_diarias enable row level security;

create policy "admin le as visitas"
  on visitas_diarias for select
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- Funcao publica. So conta paginas que existem de verdade (as fixas do site ou um guia
-- publicado); qualquer outro texto e ignorado, pra ninguem encher a tabela com lixo.
create or replace function registrar_visita(p_caminho text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caminho text := left(coalesce(p_caminho, ''), 200);
begin
  if v_caminho not in ('/', '/guias', '/videos', '/aves-a-venda', '/achei-uma-ave')
     and not exists (
       select 1 from artigos a where a.publicado and '/guias/' || a.slug = v_caminho
     ) then
    return;
  end if;

  insert into visitas_diarias (dia, caminho, total)
  values ((now() at time zone 'America/Sao_Paulo')::date, v_caminho, 1)
  on conflict (dia, caminho) do update set total = visitas_diarias.total + 1;
end;
$$;

grant execute on function registrar_visita(text) to anon, authenticated;
