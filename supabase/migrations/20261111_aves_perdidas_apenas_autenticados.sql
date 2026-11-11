-- Cadastro de anúncios de aves perdidas somente por usuários autenticados.
-- Mantém a leitura pública dos anúncios aprovados e a moderação administrativa.
alter table public.anuncios_aves_perdidas
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

drop policy if exists "publico envia anuncio pendente de ave perdida" on public.anuncios_aves_perdidas;
drop policy if exists "usuario autenticado cadastra sua ave perdida" on public.anuncios_aves_perdidas;
create policy "usuario autenticado cadastra sua ave perdida"
  on public.anuncios_aves_perdidas for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pendente');

drop policy if exists "usuario consulta seus anuncios de aves perdidas" on public.anuncios_aves_perdidas;
create policy "usuario consulta seus anuncios de aves perdidas"
  on public.anuncios_aves_perdidas for select
  to authenticated
  using (user_id = auth.uid());

revoke insert on public.anuncios_aves_perdidas from anon;
grant insert, select on public.anuncios_aves_perdidas to authenticated;
