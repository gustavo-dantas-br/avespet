-- Exigir identificação e vínculo a conta em novos anúncios de ave perdida.
-- Preserva leitura pública via RPC e anúncios históricos, sem tocá-los.
drop policy if exists "visitante envia anuncio pendente de ave perdida"
  on public.anuncios_aves_perdidas;
revoke insert on table public.anuncios_aves_perdidas from anon;

-- A regra autenticada existente valida status='pendente' e user_id=auth.uid().
-- Não alterar políticas de leitura, atualização, moderação ou SELECT público.
