-- Respostas recebidas entram no histórico privado só após vinculação segura.
-- Um identificador de e-mail do provedor só pode ser registrado uma vez.
alter table public.master_support_events
  drop constraint if exists master_support_events_event_type_check;
alter table public.master_support_events
  add constraint master_support_events_event_type_check
  check (event_type in (
    'created','ad_updated','moderated','draft_prepared',
    'email_sent','email_received','support_updated'
  ));
create unique index if not exists master_support_incoming_provider_email_uniq
  on public.master_support_events ((details ->> 'provider_email_id'))
  where event_type = 'email_received';
