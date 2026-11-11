-- Alertas administrativos para anúncios, moderação e notificações em tempo real.
create or replace function public.notificar_eventos_anuncios()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin record;
  v_nome text;
  v_mensagem text;
begin
  v_nome := coalesce(nullif(new.data->>'nomeAve',''), 'Ave sem nome');
  if new.status = 'pendente'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    v_mensagem := 'O criador enviou o anúncio de ' || v_nome || ' e ele aguarda sua aprovação.';
    for v_admin in select user_id from public.admins loop
      insert into public.notificacoes
        (user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
      values
        (v_admin.user_id,'admin','anuncio_pendente','Anúncio aguardando aprovação',
         v_mensagem,'anuncio',new.id,'anuncio-admin:'||new.id::text||':'||v_admin.user_id::text)
      on conflict (chave_evento) do nothing;
    end loop;
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('aprovado','rejeitado') then
    insert into public.notificacoes
      (user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
    values
      (new.user_id,'cliente',
       case when new.status = 'aprovado' then 'anuncio_aprovado' else 'anuncio_rejeitado' end,
       case when new.status = 'aprovado' then 'Seu anúncio foi aprovado' else 'Seu anúncio não foi aprovado' end,
       case when new.status = 'aprovado'
         then 'Seu anúncio de ' || v_nome || ' foi aprovado e já pode aparecer na vitrine.'
         else 'Seu anúncio de ' || v_nome || ' foi rejeitado. Acesse seus anúncios para conferir e ajustar as informações.'
       end,
       'anuncio',new.id,'anuncio-criador:'||new.id::text||':'||new.status)
    on conflict (chave_evento) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.notificar_eventos_anuncios() from public, anon, authenticated;
drop trigger if exists trg_notificar_eventos_anuncios on public.anuncios;
create trigger trg_notificar_eventos_anuncios
after insert or update of status on public.anuncios
for each row execute function public.notificar_eventos_anuncios();

create or replace function public.notificar_novo_anuncio_ave_perdida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_admin record;
begin
  if new.status = 'pendente' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    for v_admin in select user_id from public.admins loop
      insert into public.notificacoes
        (user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
      values
        (v_admin.user_id,'admin','anuncio_ave_perdida_pendente','Novo anúncio de ave perdida',
         'Um anúncio de ave perdida foi enviado e aguarda análise da administração.',
         'anuncio_ave_perdida',new.id,'anuncio-pendente-admin:'||new.id::text||':'||v_admin.user_id::text)
      on conflict (chave_evento) do nothing;
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function public.notificar_novo_anuncio_ave_perdida() from public, anon, authenticated;
drop trigger if exists trg_notificar_novo_anuncio_ave_perdida on public.anuncios_aves_perdidas;
create trigger trg_notificar_novo_anuncio_ave_perdida
after insert or update of status on public.anuncios_aves_perdidas
for each row execute function public.notificar_novo_anuncio_ave_perdida();

create or replace function public.notificar_achado_anilha()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
        'achado_anilha',new.id,'achado-admin:'||new.id::text||':'||v_admin.user_id::text)
      on conflict (chave_evento) do nothing;
    end loop;
  elsif tg_op = 'UPDATE' and new.owner_user_id is distinct from old.owner_user_id and new.owner_user_id is not null then
    for v_admin in select user_id from public.admins loop
      insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
      values(v_admin.user_id,'admin','possivel_titular_localizado','Possível titular localizado',v_mensagem_admin,
        'achado_anilha',new.id,'achado-admin-titular:'||new.id::text||':'||new.owner_user_id::text||':'||v_admin.user_id::text)
      on conflict (chave_evento) do nothing;
    end loop;
  end if;
  if new.owner_user_id is not null and (tg_op = 'INSERT' or new.owner_user_id is distinct from old.owner_user_id) then
    insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
    values(new.owner_user_id,'cliente','ave_identificada','Possível identificação da sua ave',
      'Recebemos um registro de ave encontrada com a anilha informada no seu anúncio. A equipe Avespet fará a intermediação.',
      'achado_anilha',new.id,'achado-cliente:'||new.id::text||':'||new.owner_user_id::text)
    on conflict (chave_evento) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.notificar_achado_anilha() from public, anon, authenticated;

-- Entrega alertas para pendências criadas antes da ativação do recurso.
insert into public.notificacoes
  (user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
select adm.user_id,'admin','anuncio_pendente','Anúncio aguardando aprovação',
       'O anúncio de '||coalesce(nullif(a.data->>'nomeAve',''),'Ave sem nome')||' já está aguardando sua aprovação.',
       'anuncio',a.id,'anuncio-admin:'||a.id::text||':'||adm.user_id::text
from public.anuncios a cross join public.admins adm
where a.status='pendente'
on conflict (chave_evento) do nothing;

insert into public.notificacoes
  (user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
select adm.user_id,'admin','anuncio_ave_perdida_pendente','Novo anúncio de ave perdida',
       'Um anúncio de ave perdida está aguardando análise da administração.',
       'anuncio_ave_perdida',a.id,'anuncio-pendente-admin:'||a.id::text||':'||adm.user_id::text
from public.anuncios_aves_perdidas a cross join public.admins adm
where a.status='pendente'
on conflict (chave_evento) do nothing;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notificacoes') then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
end $$;
