-- Histórico de notificações: arquivamento reversível.
-- Aplicar somente após validar o deploy de desenvolvimento e autorizar a mudança no banco compartilhado.
alter table public.notificacoes
  add column if not exists arquivada_em timestamptz;

create index if not exists notificacoes_user_arquivadas_idx
  on public.notificacoes (user_id, criado_em desc)
  where arquivada_em is not null;

grant update (lida_em, arquivada_em) on public.notificacoes to authenticated;
