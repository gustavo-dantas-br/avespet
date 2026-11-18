-- Etapa 1: reativação educativa de criadores (opt-in, auditoria e descadastro).
-- Nenhum cadastro anterior é considerado inscrito por padrão.
create table if not exists public.email_news_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opted_in boolean not null default false,
  consented_at timestamptz,
  opted_out_at timestamptz,
  consent_source text not null default 'perfil_criador',
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.email_news_preferences enable row level security;
revoke all on public.email_news_preferences from public,anon,authenticated;
grant select on public.email_news_preferences to authenticated;
grant select,insert,update,delete on public.email_news_preferences to service_role;
create policy email_news_preferences_own_select
 on public.email_news_preferences for select to authenticated
 using ((select auth.uid()) = user_id);

-- Preferências são alteradas apenas por RPC, com data de consentimento registrada no servidor.
create or replace function public.set_email_news_opt_in(wants_emails boolean)
returns boolean
language plpgsql security definer set search_path = ''
as $func$
declare uid uuid := (select auth.uid());
begin
  if uid is null or wants_emails is null then
    raise exception 'Sessão e escolha explícita são obrigatórias';
  end if;
  insert into public.email_news_preferences
    (user_id,opted_in,consented_at,opted_out_at,consent_source)
  values
    (uid,wants_emails,case when wants_emails then now() else null end,
     case when wants_emails then null else now() end,'perfil_criador')
  on conflict (user_id) do update set
    opted_in = excluded.opted_in,
    consented_at = case when excluded.opted_in then now() else public.email_news_preferences.consented_at end,
    opted_out_at = case when excluded.opted_in then null else now() end,
    consent_source = 'perfil_criador',updated_at = now();
  return wants_emails;
end;
$func$;
revoke all on function public.set_email_news_opt_in(boolean) from public,anon;
grant execute on function public.set_email_news_opt_in(boolean) to authenticated;

-- Apenas o servidor pode registrar as visitas. Não altera fluxo de login ou senha.
create table if not exists public.email_user_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);
alter table public.email_user_activity enable row level security;
revoke all on public.email_user_activity from public,anon,authenticated;
grant select,insert,update,delete on public.email_user_activity to service_role;

create or replace function public.mark_app_visit()
returns void language plpgsql security definer set search_path = ''
as $fn$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Autenticação obrigatória'; end if;
  insert into public.email_user_activity (user_id,last_seen_at)
  values (uid, now())
  on conflict (user_id) do update
    set last_seen_at = greatest(public.email_user_activity.last_seen_at, now());
end;
$fn$;
revoke all on function public.mark_app_visit() from public,anon;
grant execute on function public.mark_app_visit() to authenticated;

-- Auditoria privada e idempotência por episódio de inatividade.
create table if not exists public.email_reengagement_delivery (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_at timestamptz not null,
  status text not null check(status in ('processing','sent','failed','uncertain')),
  topic text not null check(topic in ('ringneck','calopsita','geral')),
  provider_id text,
  failure_reason text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(user_id,episode_at)
);
create index if not exists email_reengagement_delivery_recent_idx
  on public.email_reengagement_delivery (user_id,created_at desc);
alter table public.email_reengagement_delivery enable row level security;
revoke all on public.email_reengagement_delivery from public,anon,authenticated;
grant select,insert,update,delete on public.email_reengagement_delivery to service_role;

create table if not exists public.email_reengagement_settings (
  singleton boolean primary key default true check(singleton=true),
  enabled boolean not null default false,
  min_inactive_days smallint not null default 5 check (min_inactive_days between 5 and 90),
  cooldown_days smallint not null default 30 check (cooldown_days between 14 and 90),
  max_per_day smallint not null default 10 check(max_per_day between 1 and 50),
  scheduler_sha256 text not null check(char_length(scheduler_sha256)=64),
  updated_at timestamptz not null default now()
);
alter table public.email_reengagement_settings enable row level security;
revoke all on public.email_reengagement_settings from public,anon,authenticated;
grant select,insert,update,delete on public.email_reengagement_settings to service_role;

-- Criação conjunta da senha de agendamento em Vault e de sua impressão SHA-256.
-- O segredo nunca é guardado em texto simples numa tabela pública ou no GitHub.
do $init$
declare s text := encode(gen_random_bytes(32),'hex');
begin
  if not exists (select 1 from public.email_reengagement_settings) then
    perform vault.create_secret(s,'avespet_reengagement_scheduler','Agendamento de dicas educativas do Avespet',null);
    insert into public.email_reengagement_settings (singleton,scheduler_sha256)
    values (true,encode(sha256(convert_to(s,'UTF8')),'hex'));
  end if;
end;
$init$;
