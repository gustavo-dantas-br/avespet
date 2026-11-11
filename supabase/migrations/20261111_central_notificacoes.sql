-- Central de notificacoes Avespet: cliente e administracao
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null default 'cliente' check (audience in ('cliente','admin')),
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  referencia_tipo text,
  referencia_id uuid,
  chave_evento text not null unique,
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists notificacoes_user_nao_lidas_idx
  on public.notificacoes(user_id, criado_em desc) where lida_em is null;
create index if not exists notificacoes_user_criado_idx
  on public.notificacoes(user_id, criado_em desc);

alter table public.notificacoes enable row level security;
revoke all on public.notificacoes from anon, authenticated;
grant select, update on public.notificacoes to authenticated;

drop policy if exists notificacoes_select_proprias on public.notificacoes;
create policy notificacoes_select_proprias on public.notificacoes
for select to authenticated using (
  user_id = (select auth.uid())
  and (
    audience = 'cliente'
    or (audience = 'admin' and exists (
      select 1 from public.admins adm where adm.user_id = (select auth.uid())
    ))
  )
);

drop policy if exists notificacoes_update_proprias on public.notificacoes;
create policy notificacoes_update_proprias on public.notificacoes
for update to authenticated using (
  user_id = (select auth.uid())
  and (
    audience = 'cliente'
    or (audience = 'admin' and exists (
      select 1 from public.admins adm where adm.user_id = (select auth.uid())
    ))
  )
) with check (
  user_id = (select auth.uid())
  and (
    audience = 'cliente'
    or (audience = 'admin' and exists (
      select 1 from public.admins adm where adm.user_id = (select auth.uid())
    ))
  )
);

create or replace function public.notificar_achado_anilha()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin record;
begin
  if tg_op = 'INSERT' then
    for v_admin in select user_id from public.admins loop
      insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
      values(v_admin.user_id,'admin','ave_encontrada','Nova ave encontrada',
        'Uma ave foi registrada pela busca de anilha e aguarda intermediação.',
        'achado_anilha',new.id,'achado-admin:'||new.id::text)
      on conflict (chave_evento) do nothing;
    end loop;
  end if;

  if new.owner_user_id is not null then
    insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
    values(new.owner_user_id,'cliente','ave_identificada','Possível identificação da sua ave',
      'Recebemos um registro de ave encontrada com a anilha informada no seu anúncio. A equipe Avespet fará a intermediação.',
      'achado_anilha',new.id,'achado-cliente:'||new.id::text||':'||new.owner_user_id::text)
    on conflict (chave_evento) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_achado_anilha on public.achados_anilha;
create trigger trg_notificar_achado_anilha
after insert or update of owner_user_id on public.achados_anilha
for each row execute function public.notificar_achado_anilha();

create or replace function public.notificar_status_anuncio_ave_perdida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text;
  v_mensagem text;
begin
  if new.user_id is null or new.status is not distinct from old.status then
    return new;
  end if;
  if new.status = 'aprovado' then
    v_titulo := 'Seu anúncio foi aprovado';
    v_mensagem := 'Seu anúncio de ave perdida foi aprovado e já pode ser consultado na plataforma.';
  elsif new.status = 'rejeitado' then
    v_titulo := 'Seu anúncio precisa de ajustes';
    v_mensagem := 'A administração analisou seu anúncio. Entre na sua conta para verificar a atualização.';
  elsif new.status = 'encerrado' then
    v_titulo := 'Anúncio encerrado';
    v_mensagem := 'O status do seu anúncio de ave perdida foi atualizado pela administração.';
  else
    return new;
  end if;
  insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
  values(new.user_id,'cliente','status_anuncio_ave_perdida',v_titulo,v_mensagem,
    'anuncio_ave_perdida',new.id,'anuncio-status:'||new.id::text||':'||new.status)
  on conflict (chave_evento) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_notificar_status_anuncio_ave_perdida on public.anuncios_aves_perdidas;
create trigger trg_notificar_status_anuncio_ave_perdida
after update of status on public.anuncios_aves_perdidas
for each row execute function public.notificar_status_anuncio_ave_perdida();

revoke all on function public.notificar_achado_anilha() from public, anon, authenticated;
revoke all on function public.notificar_status_anuncio_ave_perdida() from public, anon, authenticated;

-- Backfill idempotente do registro FOB123 já associado ao anúncio de teste.
insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
select a.owner_user_id,'cliente','ave_identificada','Possível identificação da sua ave',
  'Recebemos um registro de ave encontrada com a anilha informada no seu anúncio. A equipe Avespet fará a intermediação.',
  'achado_anilha',a.id,'achado-cliente:'||a.id::text||':'||a.owner_user_id::text
from public.achados_anilha a
where upper(regexp_replace(coalesce(a.anilha_buscada,''),'[^A-Z0-9]','','g'))='FOB123'
  and a.owner_user_id is not null
  and a.ave_nome='Teste'
  and a.status <> 'resolvido'
on conflict (chave_evento) do nothing;
