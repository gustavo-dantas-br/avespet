-- Registrar o guia publicado incluído em cada tentativa educativa.
-- O slug é metadado de conteúdo público, sem dados pessoais.
alter table public.email_reengagement_delivery
  add column if not exists article_slug text;
comment on column public.email_reengagement_delivery.article_slug is
  'Slug do guia público sugerido no e-mail de reativação; null se não houver guia compatível.';
