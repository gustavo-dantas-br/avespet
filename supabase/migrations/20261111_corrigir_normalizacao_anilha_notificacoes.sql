-- Corrige normalizacao de anilha: converter para maiusculas antes de remover caracteres.
create or replace function public.vincular_achados_anilha_ao_anuncio_aprovado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titular uuid;
  v_qtd integer;
  v_anilha text;
begin
  if new.status <> 'aprovado' or new.user_id is null then
    return new;
  end if;
  v_anilha := regexp_replace(upper(coalesce(new.data->>'anilha','')), '[^A-Z0-9]', '', 'g');
  if v_anilha = '' then return new; end if;

  select count(distinct a.user_id), min(a.user_id::text)::uuid
    into v_qtd, v_titular
  from public.anuncios_aves_perdidas a
  where a.status = 'aprovado'
    and a.user_id is not null
    and regexp_replace(upper(coalesce(a.data->>'anilha','')), '[^A-Z0-9]', '', 'g') = v_anilha;

  if v_qtd = 1 then
    update public.achados_anilha h
      set owner_user_id = v_titular,
          ave_nome = coalesce(nullif(new.data->>'nomeAve',''), nullif(new.data->>'nome',''), h.ave_nome)
    where regexp_replace(upper(coalesce(h.anilha_buscada,'')), '[^A-Z0-9]', '', 'g') = v_anilha
      and h.owner_user_id is distinct from v_titular;
  end if;
  return new;
end;
$$;

-- Reavalia os achados ja existentes contra anuncios aprovados, sem alterar os anuncios.
with matches as (
  select h.id as achado_id, min(a.user_id::text)::uuid as titular, count(distinct a.user_id) as qtd,
         min(coalesce(nullif(a.data->>'nomeAve',''), nullif(a.data->>'nome',''))) as nome_ave
  from public.achados_anilha h
  join public.anuncios_aves_perdidas a
    on regexp_replace(upper(coalesce(h.anilha_buscada,'')), '[^A-Z0-9]', '', 'g')
     = regexp_replace(upper(coalesce(a.data->>'anilha','')), '[^A-Z0-9]', '', 'g')
   and a.status='aprovado' and a.user_id is not null
  where h.owner_user_id is null or h.owner_user_id is distinct from a.user_id
  group by h.id
)
update public.achados_anilha h
set owner_user_id=m.titular, ave_nome=coalesce(m.nome_ave,h.ave_nome)
from matches m
where h.id=m.achado_id and m.qtd=1;

-- Gera o alerta idempotente para o achado FOB123 ja associado ao titular correto.
insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
select h.owner_user_id,'cliente','ave_identificada','Possível identificação da sua ave',
  'Recebemos um registro de ave encontrada com a anilha informada no seu anúncio. A equipe Avespet fará a intermediação.',
  'achado_anilha',h.id,'achado-cliente:'||h.id::text||':'||h.owner_user_id::text
from public.achados_anilha h
where regexp_replace(upper(coalesce(h.anilha_buscada,'')), '[^A-Z0-9]', '', 'g')='FOB123'
  and h.owner_user_id is not null
  and h.ave_nome='Teste'
  and h.status <> 'resolvido'
on conflict (chave_evento) do nothing;
