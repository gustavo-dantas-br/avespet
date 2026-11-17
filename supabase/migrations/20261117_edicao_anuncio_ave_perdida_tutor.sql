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
-- As consultas públicas devem passar exclusivamente pela RPC
-- listar_aves_perdidas_publicas(), que remove contato e número de anilha.
-- A permissão antiga permitia a qualquer usuário autenticado ler o JSON completo.
drop policy if exists "publico le anuncios aprovados de aves perdidas"
  on public.anuncios_aves_perdidas;
revoke select on public.anuncios_aves_perdidas from anon;

grant select, update on public.anuncios_aves_perdidas to authenticated;
