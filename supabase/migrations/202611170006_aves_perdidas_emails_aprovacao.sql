-- Avespet: registro de envio transacional de confirmação de anúncio aprovado.
-- Somente service_role pode registrar e consultar dados desta tabela.
-- A chave primaria impede repetição do e-mail mesmo após reaprovações.
create table if not exists public.aves_perdidas_emails_aprovacao (
  anuncio_id uuid primary key references public.anuncios_aves_perdidas(id) on delete cascade,
  status text not null check (status in ('processing','sent','failed','uncertain')),
  provider_id text,
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.aves_perdidas_emails_aprovacao enable row level security;
revoke all on table public.aves_perdidas_emails_aprovacao from anon, authenticated;
grant select, insert, update, delete on table public.aves_perdidas_emails_aprovacao to service_role;
comment on table public.aves_perdidas_emails_aprovacao is
  'Controle privado de idempotência do e-mail transacional de aprovação de ave perdida; não guarda endereços nem corpo de e-mails.';
