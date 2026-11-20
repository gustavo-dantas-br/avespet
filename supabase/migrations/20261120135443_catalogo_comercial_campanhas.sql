-- Catálogo comercial independente das assinaturas. Não ativa cobrança.
begin;
create table if not exists public.campaign_packages (
 code text primary key check (code in ('destaque','bairro','cidade','regional')),
 name text not null check(char_length(name) between 2 and 80),
 description text not null default '' check(char_length(description)<=500),
 reach_label text not null check(char_length(reach_label) between 2 and 100),
 duration_days integer not null check(duration_days between 1 and 90),
 radius_km integer not null check(radius_km between 0 and 100),
 price_cents integer not null check(price_cents between 1 and 10000000),
 media_cents integer not null check(media_cents between 0 and price_cents),
 is_published boolean not null default false,
 sort_order integer not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.campaign_packages enable row level security;
revoke all on public.campaign_packages from anon, authenticated;
grant select(code,name,description,reach_label,duration_days,radius_km,price_cents,is_published,sort_order) on public.campaign_packages to anon,authenticated;
grant all on public.campaign_packages to service_role;
create policy "catalogo publicado somente leitura" on public.campaign_packages for select to anon,authenticated using(is_published);
insert into public.campaign_packages(code,name,duration_days,radius_km,price_cents,media_cents,reach_label,description,sort_order)
values
('destaque','Destaque Avespet',7,0,2990,0,'Destaque no site Avespet','Destaque na vitrine de buscas por sete dias.',1),
('bairro','Alerta Local',3,5,11990,6000,'Até 5 km','Divulgação regional no Facebook e Instagram.',2),
('cidade','Alerta Regional',7,10,22990,14000,'Até 10 km','Divulgação regional no Facebook e Instagram.',3),
('regional','Busca Intensiva',10,15,39990,27000,'Até 15 km','Divulgação ampliada no Facebook e Instagram.',4)
on conflict(code) do nothing;
alter table public.solicitacoes_campanhas_aves drop constraint if exists solicitacoes_campanhas_aves_pacote_check;
alter table public.solicitacoes_campanhas_aves add constraint solicitacoes_campanhas_aves_pacote_check check(pacote in ('destaque','bairro','cidade','regional'));
-- Guarda a cotação de referência no pedido, sem tornar valor recebido ou aprovado.
alter table public.solicitacoes_campanhas_aves add column if not exists catalog_price_cents integer check(catalog_price_cents >= 0);
alter table public.solicitacoes_campanhas_aves add column if not exists catalog_snapshot jsonb;
create or replace function public.campaign_request_snapshot() returns trigger
language plpgsql security invoker set search_path='' as $$
declare p record;
begin
  select code,name,duration_days,radius_km,price_cents into p from public.campaign_packages where code=new.pacote and is_published;
  -- Pacotes históricos continuam aceitos durante a transição. O cliente não pode forjar uma cotação.
  new.catalog_price_cents := null;
  new.catalog_snapshot := null;
  if found then
    new.catalog_price_cents := p.price_cents;
    new.catalog_snapshot := jsonb_build_object('code',p.code,'name',p.name,'duration_days',p.duration_days,'radius_km',p.radius_km,'price_cents',p.price_cents);
  elsif new.pacote = 'destaque' then
    raise exception 'Pacote indisponível';
  end if;
  return new;
end $$;
create trigger campaign_request_snapshot_before_insert before insert on public.solicitacoes_campanhas_aves for each row execute function public.campaign_request_snapshot();
commit;
