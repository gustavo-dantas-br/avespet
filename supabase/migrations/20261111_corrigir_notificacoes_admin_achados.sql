-- Corrige a central administrativa de achados ja existentes e melhora os alertas futuros.
-- Nao altera os registros de aves encontradas nem confirma titularidade automaticamente.

create or replace function public.notificar_achado_anilha()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_admin record;
  v_mensagem_admin text;
begin
  v_mensagem_admin :=
    'Anilha ' || coalesce(nullif(new.anilha_buscada, ''), '(não informada)') ||
    '. Pessoa que encontrou: ' || coalesce(nullif(new.nome_encontrador, ''), '(não informado)') ||
    '. Abra Achados por Anilha para consultar os contatos e possíveis titulares.';

  if tg_op = 'INSERT' then
    for v_admin in select user_id from public.admins loop
      insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
      values(v_admin.user_id,'admin','ave_encontrada','Nova ave encontrada',v_mensagem_admin,
        'achado_anilha',new.id,'achado-admin:'||new.id::text)
      on conflict (chave_evento) do nothing;
    end loop;
  elsif tg_op = 'UPDATE' and new.owner_user_id is distinct from old.owner_user_id and new.owner_user_id is not null then
    for v_admin in select user_id from public.admins loop
      insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
      values(v_admin.user_id,'admin','possivel_titular_localizado','Possível titular localizado',v_mensagem_admin,
        'achado_anilha',new.id,'achado-admin-titular:'||new.id::text||':'||new.owner_user_id::text)
      on conflict (chave_evento) do nothing;
    end loop;
  end if;

  if new.owner_user_id is not null
     and (tg_op = 'INSERT' or new.owner_user_id is distinct from old.owner_user_id) then
    insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
    values(new.owner_user_id,'cliente','ave_identificada','Possível identificação da sua ave',
      'Recebemos um registro de ave encontrada com a anilha informada no seu anúncio. A equipe Avespet fará a intermediação.',
      'achado_anilha',new.id,'achado-cliente:'||new.id::text||':'||new.owner_user_id::text)
    on conflict (chave_evento) do nothing;
  end if;

  return new;
end;
$fn$;

revoke all on function public.notificar_achado_anilha() from public, anon, authenticated;

-- Backfill idempotente: gera um alerta administrativo para cada achado ja cadastrado.
insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
select adm.user_id,'admin','ave_encontrada','Ave encontrada aguardando intermediação',
  'Anilha ' || coalesce(nullif(a.anilha_buscada, ''), '(não informada)') ||
  '. Pessoa que encontrou: ' || coalesce(nullif(a.nome_encontrador, ''), '(não informado)') ||
  '. Abra Achados por Anilha para consultar os contatos e possíveis titulares.',
  'achado_anilha',a.id,'achado-admin:'||a.id::text
from public.achados_anilha a
cross join public.admins adm
on conflict (chave_evento) do nothing;
