-- Reencontros públicos e relatos moderados. Nunca expor contato, anilha ou dados privados.
alter table public.anuncios_aves_perdidas drop constraint if exists anuncios_aves_perdidas_status_check;
alter table public.anuncios_aves_perdidas add constraint anuncios_aves_perdidas_status_check
  check (status in ('pendente','aprovado','rejeitado','encerrado','reencontrado'));

create table if not exists public.ave_perdida_reencontros (
  anuncio_id uuid primary key references public.anuncios_aves_perdidas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  data_reencontro date not null,
  relato text not null default '' check (char_length(relato) <= 1000),
  nota smallint check (nota between 1 and 5),
  autoriza_publicacao boolean not null default false,
  aprovado_publicacao boolean not null default false,
  confirmado_em timestamptz not null default now(),
  aprovado_em timestamptz,
  aprovado_por uuid references auth.users(id),
  atualizado_em timestamptz not null default now()
);
alter table public.ave_perdida_reencontros enable row level security;
revoke all on public.ave_perdida_reencontros from public,anon,authenticated;
grant select,insert,update,delete on public.ave_perdida_reencontros to service_role;
grant select on public.ave_perdida_reencontros to authenticated;
create policy "tutor consulta seu reencontro" on public.ave_perdida_reencontros
  for select to authenticated using (user_id=(select auth.uid()));

-- A confirmação é atômica e só pode ser realizada pela conta proprietária.
create or replace function public.confirmar_reencontro_ave_perdida(
  p_anuncio_id uuid,p_data_reencontro date,p_relato text default '',
  p_nota smallint default null,p_autoriza_publicacao boolean default false
)
returns void language plpgsql security definer set search_path=''
as $$
declare v_uid uuid := (select auth.uid()); v_anuncio public.anuncios_aves_perdidas%rowtype;
begin
  if v_uid is null then raise exception 'Entre na conta responsável para confirmar o reencontro.'; end if;
  if p_data_reencontro is null or p_data_reencontro > current_date or p_data_reencontro < date '2000-01-01' then
    raise exception 'Informe uma data de reencontro válida.';
  end if;
  if char_length(coalesce(p_relato,'')) > 1000 then raise exception 'O relato deve ter até 1000 caracteres.'; end if;
  if p_nota is not null and (p_nota < 1 or p_nota > 5) then raise exception 'Avaliação inválida.'; end if;
  select * into v_anuncio from public.anuncios_aves_perdidas
    where id=p_anuncio_id and user_id=v_uid for update;
  if not found then raise exception 'Anúncio não localizado na sua conta.'; end if;
  if v_anuncio.status not in ('aprovado','reencontrado') then
    raise exception 'A confirmação só está disponível para anúncios publicados.';
  end if;
  insert into public.ave_perdida_reencontros
    (anuncio_id,user_id,data_reencontro,relato,nota,autoriza_publicacao,aprovado_publicacao,aprovado_em,aprovado_por,atualizado_em)
  values (p_anuncio_id,v_uid,p_data_reencontro,coalesce(btrim(p_relato),''),p_nota,
    p_autoriza_publicacao,false,null,null,now())
  on conflict (anuncio_id) do update set
    data_reencontro=excluded.data_reencontro,relato=excluded.relato,
    nota=excluded.nota,autoriza_publicacao=excluded.autoriza_publicacao,
    aprovado_publicacao=false,aprovado_em=null,aprovado_por=null,atualizado_em=now()
  where public.ave_perdida_reencontros.user_id=v_uid;
  if v_anuncio.status='aprovado' then
    update public.anuncios_aves_perdidas set status='reencontrado'
    where id=p_anuncio_id and status='aprovado';
  end if;
end;
$$;
revoke all on function public.confirmar_reencontro_ave_perdida(uuid,date,text,smallint,boolean) from public,anon;
grant execute on function public.confirmar_reencontro_ave_perdida(uuid,date,text,smallint,boolean) to authenticated;

-- A consulta pública retorna explicitamente apenas campos permitidos.
create or replace function public.listar_aves_perdidas_publicas()
returns table(id uuid,data jsonb,created_at timestamptz)
language sql stable security definer set search_path=''
as $$
 select a.id,
 pg_catalog.jsonb_build_object(
  'nomeAve',a.data->'nomeAve','especie',a.data->'especie',
  'cor',a.data->'cor','sexo',a.data->'sexo',
  'idadeAproximada',a.data->'idadeAproximada',
  'caracteristicas',a.data->'caracteristicas',
  'bairro',a.data->'bairro','cidade',a.data->'cidade',
  'uf',a.data->'uf','dataPerda',a.data->'dataPerda',
  'descricao',a.data->'descricao','foto',a.data->'foto',
  'autorizaContatoPublico',false,
  'situacao',a.status,
  'dataReencontro',case when a.status='reencontrado' then r.data_reencontro end,
  'depoimento',case when a.status='reencontrado' and r.aprovado_publicacao and r.autoriza_publicacao
    then r.relato else null end,
  'avaliacao',case when a.status='reencontrado' and r.aprovado_publicacao and r.autoriza_publicacao
    then r.nota else null end
 ) as data,a.created_at
 from public.anuncios_aves_perdidas a
 left join public.ave_perdida_reencontros r on r.anuncio_id=a.id
 where a.status in ('aprovado','reencontrado')
 order by case when a.status='aprovado' then 0 else 1 end,
          case when a.status='reencontrado' then r.data_reencontro::timestamptz else a.created_at end desc nulls last;
$$;
revoke all on function public.listar_aves_perdidas_publicas() from public;
grant execute on function public.listar_aves_perdidas_publicas() to anon,authenticated;

-- Reencontros jamais voltam a uma busca ativa por edição comum.
drop policy if exists "tutor atualiza sua ave perdida para revisao" on public.anuncios_aves_perdidas;
create policy "tutor atualiza sua ave perdida para revisao" on public.anuncios_aves_perdidas
 for update to authenticated
 using (user_id=(select auth.uid()) and status in ('pendente','aprovado','rejeitado'))
 with check (user_id=(select auth.uid()) and status='pendente');

-- Eventos coerentes no histórico do Master e na notificação interna do tutor.
create or replace function public.record_lost_bird_support_event()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_type text;v_summary text;
begin
 if TG_OP='INSERT' then
   v_type:='created'; v_summary:='Anúncio cadastrado';
 elsif new.status is distinct from old.status then
   v_type:='moderated';
   v_summary:=case new.status
    when 'aprovado' then 'Anúncio aprovado'
    when 'pendente' then 'Anúncio enviado para análise'
    when 'rejeitado' then 'Anúncio não aprovado'
    when 'encerrado' then 'Busca encerrada'
    when 'reencontrado' then 'Reencontro confirmado pelo tutor'
    else 'Situação do anúncio atualizada' end;
 elsif new.data is distinct from old.data then
   v_type:='ad_updated';v_summary:='Informações da ave atualizadas';
 else return new; end if;
 insert into public.master_support_events(source,source_id,event_type,summary,actor_user_id,details)
 values ('perdida',new.id,v_type,v_summary,(select auth.uid()),
   pg_catalog.jsonb_build_object('status',new.status));
 return new;
end;
$$;

create or replace function public.notificar_status_anuncio_ave_perdida()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_titulo text;v_mensagem text;
begin
 if new.user_id is null or new.status is not distinct from old.status then return new;end if;
 if new.status='aprovado' then
   v_titulo:='Seu anúncio foi aprovado';v_mensagem:='Seu anúncio de ave perdida foi aprovado e já pode ser consultado na plataforma.';
 elsif new.status='rejeitado' then
   v_titulo:='Seu anúncio precisa de ajustes';v_mensagem:='A administração analisou seu anúncio. Entre na sua conta para verificar a atualização.';
 elsif new.status='encerrado' then
   v_titulo:='Anúncio encerrado';v_mensagem:='O status do seu anúncio de ave perdida foi atualizado pela administração.';
 elsif new.status='reencontrado' then
   v_titulo:='Que alegria! Sua ave foi reencontrada 💚';
   v_mensagem:='O reencontro foi registrado com sucesso. Seu anúncio seguirá visível na seção de aves perdidas, identificado como reencontrado.';
 else return new; end if;
 insert into public.notificacoes(user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,chave_evento)
 values(new.user_id,'cliente','status_anuncio_ave_perdida',v_titulo,v_mensagem,
 'anuncio_ave_perdida',new.id,'anuncio-status:'||new.id::text||':'||new.status)
 on conflict(chave_evento) do nothing;
 return new;
end;
$$;
