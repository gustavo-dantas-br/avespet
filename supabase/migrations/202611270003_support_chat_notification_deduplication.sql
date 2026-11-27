-- Mantém apenas uma notificação por chamado e destinatário.
-- Cada nova mensagem atualiza a notificação existente, preservando o aviso mais recente.

create or replace function public.support_ticket_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_ticket public.support_tickets%rowtype;
  v_master record;
  v_first_message boolean;
  v_event_key text;
begin
  update public.support_tickets
  set last_message_at = new.created_at,
      last_message_by = case when new.author_type = 'support' then 'suporte' else 'criador' end,
      creator_unread = (new.author_type = 'support'),
      support_unread = (new.author_type = 'creator'),
      status = case when new.author_type = 'support' then 'aguardando_criador' else 'aberto' end,
      updated_at = now()
  where id = new.ticket_id
  returning * into v_ticket;

  select count(*) = 1 into v_first_message
  from public.support_ticket_messages
  where ticket_id = new.ticket_id;

  if new.author_type = 'creator' then
    for v_master in select user_id from public.master_admins loop
      v_event_key := 'support-chat:admin:' || v_ticket.id::text || ':' || v_master.user_id::text;
      insert into public.notificacoes(
        user_id, audience, tipo, titulo, mensagem,
        referencia_tipo, referencia_id, chave_evento
      ) values (
        v_master.user_id, 'admin', 'support_ticket_message',
        case when v_first_message then 'Novo chamado aberto pelo criador' else 'Nova mensagem no suporte' end,
        case when v_first_message
          then 'Um criador abriu o chamado ' || v_ticket.protocol || '. Acesse a Central de Atendimento para responder.'
          else 'O criador enviou uma nova mensagem no chamado ' || v_ticket.protocol || '.'
        end,
        'support_ticket', v_ticket.id, v_event_key
      )
      on conflict (chave_evento) do update set
        tipo = excluded.tipo,
        titulo = excluded.titulo,
        mensagem = excluded.mensagem,
        referencia_tipo = excluded.referencia_tipo,
        referencia_id = excluded.referencia_id,
        criado_em = now(),
        lida_em = null,
        arquivada_em = null;
    end loop;
  elsif new.body <> 'Olá! Seja bem-vindo(a) ao suporte Avespet. Recebemos sua mensagem e nossa equipe responderá assim que possível. Enquanto isso, pode enviar suas dúvidas ou acrescentar mais detalhes por aqui. Estamos à disposição!' then
    v_event_key := 'support-chat:cliente:' || v_ticket.id::text || ':' || v_ticket.user_id::text;
    insert into public.notificacoes(
      user_id, audience, tipo, titulo, mensagem,
      referencia_tipo, referencia_id, chave_evento
    ) values (
      v_ticket.user_id, 'cliente', 'support_ticket_reply',
      'O suporte respondeu seu chamado',
      'A equipe Avespet respondeu ao chamado ' || v_ticket.protocol || '.',
      'support_ticket', v_ticket.id, v_event_key
    )
    on conflict (chave_evento) do update set
      tipo = excluded.tipo,
      titulo = excluded.titulo,
      mensagem = excluded.mensagem,
      referencia_tipo = excluded.referencia_tipo,
      referencia_id = excluded.referencia_id,
      criado_em = now(),
      lida_em = null,
      arquivada_em = null;
  end if;
  return new;
end;
$function$;

-- Consolida notificações antigas de chamados, mantendo a mais recente por público,
-- usuário e conversa, e padroniza a chave para atualizações futuras.
with ranked as (
  select id, row_number() over (
    partition by user_id, audience, referencia_tipo, referencia_id
    order by criado_em desc, id desc
  ) as rn
  from public.notificacoes
  where referencia_tipo = 'support_ticket'
    and referencia_id is not null
)
delete from public.notificacoes n
using ranked r
where n.id = r.id and r.rn > 1;

update public.notificacoes
set chave_evento = 'support-chat:' || audience || ':' || referencia_id::text || ':' || user_id::text
where referencia_tipo = 'support_ticket' and referencia_id is not null;
