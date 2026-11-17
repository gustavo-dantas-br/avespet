-- Permite ao titular autenticado corrigir seus próprios anúncios de aves perdidas.
-- A alteração retorna o anúncio para moderação; ninguém publica sem aprovação.
drop policy if exists "tutor atualiza sua ave perdida para revisao"
  on public.anuncios_aves_perdidas;
create policy "tutor atualiza sua ave perdida para revisao"
  on public.anuncios_aves_perdidas
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('pendente', 'aprovado', 'rejeitado')
  )
  with check (
    user_id = (select auth.uid())
    and status = 'pendente'
  );
grant select, update on public.anuncios_aves_perdidas to authenticated;
