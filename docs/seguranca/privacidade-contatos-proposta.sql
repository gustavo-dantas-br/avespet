-- Proposta para homologação. NÃO executar automaticamente na produção.
-- Aplicar a Fase 1 antes da nova interface; Fase 2 somente após validação da vitrine
-- e confirmação do contato pelo anunciante legado. Nenhuma exclusão de perfis.
begin;
create schema if not exists avespet_private;
revoke all on schema avespet_private from public, anon, authenticated;
create table if not exists public.perfis_comerciais_publicos (
  user_id uuid primary key references public.perfil_criador(user_id) on delete cascade,
  data jsonb not null
);
alter table public.perfis_comerciais_publicos enable row level security;
revoke all on public.perfis_comerciais_publicos from public, anon, authenticated;
grant select on public.perfis_comerciais_publicos to anon, authenticated;
create policy "vitrine somente vendedor aprovado" on public.perfis_comerciais_publicos
for select to anon, authenticated using (
  exists (select 1 from public.anuncios a where a.user_id = perfis_comerciais_publicos.user_id and a.ativo = true and a.status = 'aprovado')
);
create or replace function avespet_private.sync_perfil_comercial()
returns trigger language plpgsql security definer set search_path = '' as $$
declare contato text := regexp_replace(coalesce(new.data->>'whatsappComercial',''), '[^0-9]', '', 'g');
begin
  insert into public.perfis_comerciais_publicos(user_id,data)
  values(new.user_id,jsonb_build_object(
    'nomeCriatorio',coalesce(new.data->>'nomeCriatorio',''),
    'cidade',coalesce(new.data->>'cidade',''),
    'uf',coalesce(new.data->>'uf',''),
    'logoUrl',coalesce(new.data->>'logoUrl',''),
    'whatsapp',case when new.data->'autorizaWhatsappComercial' = 'true'::jsonb
      and contato ~ '^(55)?[1-9][0-9]9?[0-9]{8}$' then contato else '' end
  )) on conflict(user_id) do update set data=excluded.data;
  return new;
end;
$$;
revoke all on function avespet_private.sync_perfil_comercial() from public, anon, authenticated;
create trigger sync_perfil_comercial after insert or update of data on public.perfil_criador
for each row execute function avespet_private.sync_perfil_comercial();
-- Backfill somente campos permitidos. Não copia telefone pessoal.
insert into public.perfis_comerciais_publicos(user_id,data)
select p.user_id,jsonb_build_object(
  'nomeCriatorio',coalesce(p.data->>'nomeCriatorio',''),
  'cidade',coalesce(p.data->>'cidade',''),
  'uf',coalesce(p.data->>'uf',''),
  'logoUrl',coalesce(p.data->>'logoUrl',''),
  'whatsapp',case when p.data->'autorizaWhatsappComercial' = 'true'::jsonb
    and regexp_replace(coalesce(p.data->>'whatsappComercial',''),'[^0-9]','','g') ~ '^(55)?[1-9][0-9]9?[0-9]{8}$'
    then regexp_replace(p.data->>'whatsappComercial','[^0-9]','','g') else '' end
) from public.perfil_criador p on conflict(user_id) do nothing;
commit;

-- FASE 2: após homologar e publicar frontend compatível. Executar separadamente.
-- A política anterior do titular permanece intacta.
-- begin;
-- create policy "moderador consulta perfis" on public.perfil_criador for select to authenticated
-- using (exists(select 1 from public.admins a where a.user_id = (select auth.uid())));
-- drop policy "qualquer um pode ver o perfil publico" on public.perfil_criador;
-- revoke select on public.perfil_criador from anon;
-- commit;
--
-- Testes obrigatórios (com JWT anônimo, titular, outro usuário, administrador):
-- 1. anônimo não acessa perfil_criador, mas consulta projeção de vendedores aprovados;
-- 2. usuário não lê perfil de outro usuário, nem altera projeção diretamente;
-- 3. titular mantém telefone e altera ou revoga autorização; projeção atualiza;
-- 4. anúncio inativo/pendente não libera projeção;
-- 5. moderador autorizado acessa dados administrativos e Master continua funcional.
-- 6. testar anúncios antigos, cadastro de perdidas e fluxo de WhatsApp.
