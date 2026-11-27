-- Identidade explícita de suporte e saudação automática no primeiro chamado.
create or replace function public.support_ticket_create(
  p_subject text,
  p_category text,
  p_body text,
  p_creator_name text default '',
  p_creator_email text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_ticket_id uuid;
  v_claims jsonb := auth.jwt();
  v_creator_name text;
  v_creator_email text;
begin
  if v_user is null then raise exception 'Autenticação necessária.'; end if;
  if char_length(trim(coalesce(p_subject,''))) < 4 or char_length(trim(coalesce(p_subject,''))) > 120 then
    raise exception 'Informe um assunto entre 4 e 120 caracteres.';
  end if;
  if p_category not in ('tecnico','financeiro','cadastro','anuncios','outro') then
    raise exception 'Categoria inválida.';
  end if;
  if char_length(trim(coalesce(p_body,''))) < 5 or char_length(trim(coalesce(p_body,''))) > 5000 then
    raise exception 'A mensagem deve ter entre 5 e 5.000 caracteres.';
  end if;

  v_creator_name := left(trim(coalesce(
    v_claims -> 'user_metadata' ->> 'full_name',
    v_claims -> 'user_metadata' ->> 'name',
    ''
  )),120);
  v_creator_email := left(trim(coalesce(v_claims ->> 'email','')),254);

  insert into public.support_tickets(user_id,creator_name,creator_email,subject,category)
  values (v_user,v_creator_name,v_creator_email,trim(p_subject),p_category)
  returning id into v_ticket_id;

  insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body)
  values (v_ticket_id,v_user,'creator',trim(p_body));

  -- Saudação automática registrada como mensagem da equipe, sem usuário fictício.
  insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body)
  values (
    v_ticket_id,
    v_user,
    'support',
    'Olá! Seja bem-vindo(a) ao suporte Avespet. Recebemos sua mensagem e nossa equipe responderá assim que possível. Enquanto isso, pode enviar suas dúvidas ou acrescentar mais detalhes por aqui. Estamos à disposição!'
  );

  -- A saudação não deve tirar o chamado da fila de novos atendimentos.
  update public.support_tickets
  set status = 'aberto',
      last_message_by = 'suporte',
      creator_unread = false,
      support_unread = true,
      updated_at = now()
  where id = v_ticket_id;

  return v_ticket_id;
end;
$$;

create or replace function public.support_ticket_send_message(
  p_ticket_id uuid,
  p_body text,
  p_as_support boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.support_tickets%rowtype;
  v_author_type text;
  v_message_id uuid;
begin
  if v_user is null then raise exception 'Autenticação necessária.'; end if;
  if char_length(trim(coalesce(p_body,''))) < 1 or char_length(trim(coalesce(p_body,''))) > 5000 then
    raise exception 'A mensagem deve ter entre 1 e 5.000 caracteres.';
  end if;

  select * into v_ticket from public.support_tickets where id = p_ticket_id for update;
  if not found then raise exception 'Chamado não encontrado.'; end if;

  if coalesce(p_as_support, false) then
    if not exists (select 1 from public.master_admins m where m.user_id = v_user) then
      raise exception 'Somente a equipe Master pode responder como suporte.';
    end if;
    v_author_type := 'support';
  else
    if v_ticket.user_id <> v_user then
      raise exception 'Somente o criador responsável pode responder como criador.';
    end if;
    v_author_type := 'creator';
  end if;

  insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body)
  values (p_ticket_id,v_user,v_author_type,trim(p_body))
  returning id into v_message_id;
  return v_message_id;
end;
$$;

-- A mensagem automática de boas-vindas não gera uma notificação redundante ao criador.
create or replace function public.support_ticket_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_master record;
  v_first_message boolean;
begin
  update public.support_tickets
  set last_message_at = new.created_at,
      last_message_by = case when new.author_type = 'support' then 'suporte' else 'criador' end,
      creator_unread = (new.author_type = 'support'),
      support_unread = (new.author_type = 'creator'),
      status = case
        when new.author_type = 'support' then 'aguardando_criador'
        else 'aberto'
      end,
      updated_at = now()
  where id = new.ticket_id
  returning * into v_ticket;

  select count(*) = 1 into v_first_message
  from public.support_ticket_messages
  where ticket_id = new.ticket_id;

  if new.author_type = 'creator' then
    for v_master in select user_id from public.master_admins loop
      insert into public.notificacoes(
        user_id, audience, tipo, titulo, mensagem,
        referencia_tipo, referencia_id, chave_evento
      ) values (
        v_master.user_id, 'admin', 'support_ticket_message',
        case when v_first_message then 'Novo chamado de suporte' else 'Nova mensagem no suporte' end,
        'O criador enviou uma mensagem no chamado ' || v_ticket.protocol || '.',
        'support_ticket', v_ticket.id,
        'support-chat:' || new.id::text || ':' || v_master.user_id::text
      ) on conflict (chave_evento) do nothing;
    end loop;
  elsif new.body <> 'Olá! Seja bem-vindo(a) ao suporte Avespet. Recebemos sua mensagem e nossa equipe responderá assim que possível. Enquanto isso, pode enviar suas dúvidas ou acrescentar mais detalhes por aqui. Estamos à disposição!' then
    insert into public.notificacoes(
      user_id, audience, tipo, titulo, mensagem,
      referencia_tipo, referencia_id, chave_evento
    ) values (
      v_ticket.user_id, 'cliente', 'support_ticket_reply',
      'O suporte respondeu seu chamado',
      'A equipe Avespet respondeu ao chamado ' || v_ticket.protocol || '.',
      'support_ticket', v_ticket.id,
      'support-chat:' || new.id::text || ':' || v_ticket.user_id::text
    ) on conflict (chave_evento) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.support_ticket_create(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.support_ticket_create(text,text,text,text,text) to authenticated;
revoke all on function public.support_ticket_send_message(uuid,text) from public, anon, authenticated;
revoke all on function public.support_ticket_send_message(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.support_ticket_send_message(uuid,text,boolean) to authenticated;
revoke all on function public.support_ticket_after_message() from public, anon, authenticated;
