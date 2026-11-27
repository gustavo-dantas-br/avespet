-- Chat de chamados entre criadores e equipe Master do Avespet.
-- Acesso por RLS; mensagens e alterações de estado passam por RPCs validadas.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique default (
    'AVS-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_name text not null default '' check (char_length(creator_name) <= 120),
  creator_email text not null default '' check (char_length(creator_email) <= 254),
  subject text not null check (char_length(trim(subject)) between 4 and 120),
  category text not null check (category in ('tecnico','financeiro','cadastro','anuncios','outro')),
  status text not null default 'aberto'
    check (status in ('aberto','em_atendimento','aguardando_criador','resolvido')),
  last_message_at timestamptz not null default now(),
  last_message_by text not null default 'criador' check (last_message_by in ('criador','suporte')),
  creator_unread boolean not null default false,
  support_unread boolean not null default true,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_updated_idx
  on public.support_tickets(user_id, updated_at desc);
create index if not exists support_tickets_inbox_idx
  on public.support_tickets(support_unread, status, updated_at desc);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  author_type text not null check (author_type in ('creator','support')),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists support_ticket_messages_thread_idx
  on public.support_ticket_messages(ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

revoke all on public.support_tickets from public, anon, authenticated;
revoke all on public.support_ticket_messages from public, anon, authenticated;
grant select on public.support_tickets to authenticated;
grant select on public.support_ticket_messages to authenticated;

drop policy if exists support_tickets_read_participant on public.support_tickets;
create policy support_tickets_read_participant on public.support_tickets
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.master_admins m where m.user_id = (select auth.uid()))
);

drop policy if exists support_ticket_messages_read_participant on public.support_ticket_messages;
create policy support_ticket_messages_read_participant on public.support_ticket_messages
for select to authenticated
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = support_ticket_messages.ticket_id
      and (
        t.user_id = (select auth.uid())
        or exists (select 1 from public.master_admins m where m.user_id = (select auth.uid()))
      )
  )
);

create or replace function public.support_ticket_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_master record;
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

  if new.author_type = 'creator' then
    for v_master in select user_id from public.master_admins loop
      insert into public.notificacoes(
        user_id, audience, tipo, titulo, mensagem,
        referencia_tipo, referencia_id, chave_evento
      ) values (
        v_master.user_id, 'admin', 'support_ticket_message',
        case when v_ticket.created_at = new.created_at then 'Novo chamado de suporte' else 'Nova mensagem no suporte' end,
        'O criador enviou uma mensagem no chamado ' || v_ticket.protocol || '.',
        'support_ticket', v_ticket.id,
        'support-chat:' || new.id::text || ':' || v_master.user_id::text
      ) on conflict (chave_evento) do nothing;
    end loop;
  else
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

drop trigger if exists trg_support_ticket_after_message on public.support_ticket_messages;
create trigger trg_support_ticket_after_message
after insert on public.support_ticket_messages
for each row execute function public.support_ticket_after_message();

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

  insert into public.support_tickets(user_id,creator_name,creator_email,subject,category)
  values (
    v_user,
    left(trim(coalesce(p_creator_name,'')),120),
    left(trim(coalesce(p_creator_email,'')),254),
    trim(p_subject),p_category
  ) returning id into v_ticket_id;

  insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body)
  values (v_ticket_id,v_user,'creator',trim(p_body));

  return v_ticket_id;
end;
$$;

create or replace function public.support_ticket_send_message(p_ticket_id uuid, p_body text)
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

  if v_ticket.user_id = v_user then
    v_author_type := 'creator';
  elsif exists (select 1 from public.master_admins m where m.user_id = v_user) then
    v_author_type := 'support';
  else
    raise exception 'Você não tem acesso a este chamado.';
  end if;

  insert into public.support_ticket_messages(ticket_id,author_user_id,author_type,body)
  values (p_ticket_id,v_user,v_author_type,trim(p_body))
  returning id into v_message_id;
  return v_message_id;
end;
$$;

create or replace function public.support_ticket_mark_read(p_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
begin
  if v_user is null then raise exception 'Autenticação necessária.'; end if;
  select user_id into v_owner from public.support_tickets where id = p_ticket_id;
  if not found then raise exception 'Chamado não encontrado.'; end if;

  if v_owner = v_user then
    update public.support_tickets set creator_unread = false where id = p_ticket_id;
  elsif exists (select 1 from public.master_admins m where m.user_id = v_user) then
    update public.support_tickets set support_unread = false where id = p_ticket_id;
  else
    raise exception 'Você não tem acesso a este chamado.';
  end if;
end;
$$;

create or replace function public.support_ticket_set_status(p_ticket_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.master_admins m where m.user_id = auth.uid()
  ) then
    raise exception 'Acesso restrito ao Master.';
  end if;
  if p_status not in ('aberto','em_atendimento','aguardando_criador','resolvido') then
    raise exception 'Status inválido.';
  end if;
  update public.support_tickets set status = p_status, updated_at = now()
  where id = p_ticket_id;
  if not found then raise exception 'Chamado não encontrado.'; end if;
end;
$$;

revoke all on function public.support_ticket_after_message() from public, anon, authenticated;
revoke all on function public.support_ticket_create(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.support_ticket_send_message(uuid,text) from public, anon, authenticated;
revoke all on function public.support_ticket_mark_read(uuid) from public, anon, authenticated;
revoke all on function public.support_ticket_set_status(uuid,text) from public, anon, authenticated;
grant execute on function public.support_ticket_create(text,text,text,text,text) to authenticated;
grant execute on function public.support_ticket_send_message(uuid,text) to authenticated;
grant execute on function public.support_ticket_mark_read(uuid) to authenticated;
grant execute on function public.support_ticket_set_status(uuid,text) to authenticated;

-- Permite que os usuários Master consultem suas notificações administrativas.
drop policy if exists notificacoes_select_proprias on public.notificacoes;
create policy notificacoes_select_proprias on public.notificacoes
for select to authenticated using (
  user_id = (select auth.uid())
  and (
    (audience = 'cliente')
    or (audience = 'admin' and (
      exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
      or exists (select 1 from public.master_admins m where m.user_id = (select auth.uid()))
    ))
  )
);

drop policy if exists notificacoes_update_proprias on public.notificacoes;
create policy notificacoes_update_proprias on public.notificacoes
for update to authenticated using (
  user_id = (select auth.uid())
  and (
    (audience = 'cliente')
    or (audience = 'admin' and (
      exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
      or exists (select 1 from public.master_admins m where m.user_id = (select auth.uid()))
    ))
  )
) with check (
  user_id = (select auth.uid())
  and (
    (audience = 'cliente')
    or (audience = 'admin' and (
      exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
      or exists (select 1 from public.master_admins m where m.user_id = (select auth.uid()))
    ))
  )
);

-- Realtime para atualização da lista e da conversa sem recarregar a página.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_tickets'
  ) then
    alter publication supabase_realtime add table public.support_tickets;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_ticket_messages'
  ) then
    alter publication supabase_realtime add table public.support_ticket_messages;
  end if;
end;
$$;

comment on table public.support_tickets is 'Chamados privados abertos pelos criadores e atendidos pela equipe Master do Avespet.';
comment on table public.support_ticket_messages is 'Mensagens persistentes das conversas de suporte do Avespet.';
