-- Linha do tempo privada por ocorrência, sem dados de contato, anilha ou corpo de e-mail.
create table if not exists public.master_support_events (
  id bigint generated always as identity primary key,
  source text not null check (source in ('perdida')),
  source_id uuid not null,
  event_type text not null check (event_type in ('created', 'ad_updated', 'moderated', 'draft_prepared', 'email_sent', 'support_updated')),
  summary text not null check (char_length(summary) between 1 and 180),
  actor_user_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists master_support_events_case_time_idx
  on public.master_support_events (source, source_id, created_at desc);
alter table public.master_support_events enable row level security;
revoke all on table public.master_support_events from public, anon, authenticated;
grant select, insert on public.master_support_events to service_role;

create or replace function public.record_lost_bird_support_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_type text;
  v_summary text;
begin
  if TG_OP = 'INSERT' then
    v_type := 'created'; v_summary := 'Anúncio cadastrado';
  elsif NEW.status is distinct from OLD.status then
    v_type := 'moderated';
    v_summary := case NEW.status
      when 'aprovado' then 'Anúncio aprovado'
      when 'pendente' then 'Anúncio enviado para análise'
      when 'rejeitado' then 'Anúncio não aprovado'
      when 'encerrado' then 'Busca encerrada'
      else 'Situação do anúncio atualizada' end;
  elsif NEW.data is distinct from OLD.data then
    v_type := 'ad_updated'; v_summary := 'Informações da ave atualizadas';
  else
    return NEW;
  end if;
  insert into public.master_support_events
    (source,source_id,event_type,summary,actor_user_id,details)
  values ('perdida',NEW.id,v_type,v_summary,(select auth.uid()),
    pg_catalog.jsonb_build_object('status',NEW.status));
  return NEW;
end;
$fn$;
revoke all on function public.record_lost_bird_support_event() from public, anon, authenticated;
drop trigger if exists trg_lost_bird_support_event on public.anuncios_aves_perdidas;
create trigger trg_lost_bird_support_event
  after insert or update on public.anuncios_aves_perdidas
  for each row execute function public.record_lost_bird_support_event();
