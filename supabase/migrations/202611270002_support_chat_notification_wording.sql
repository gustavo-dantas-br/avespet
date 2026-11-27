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
        case when v_first_message then 'Novo chamado aberto pelo criador' else 'Nova mensagem no suporte' end,
        case when v_first_message
          then 'Um criador abriu o chamado ' || v_ticket.protocol || '. Acesse a Central de Atendimento para responder.'
          else 'O criador enviou uma nova mensagem no chamado ' || v_ticket.protocol || '.'
        end,
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
revoke all on function public.support_ticket_after_message() from public, anon, authenticated;