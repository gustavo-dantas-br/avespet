-- Encaminha novas notificacoes para a Edge Function via pg_net.
create extension if not exists pg_net;

-- O unico segredo lido pelo banco e o segredo compartilhado do webhook.
-- A Edge Function usa SUPABASE_SERVICE_ROLE_KEY internamente, sem expor essa chave ao banco/HTTP.
create or replace function public.encaminhar_notificacao_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_webhook_secret text;
  v_project_url text := 'https://tnnpzitijvklbnwptsuq.supabase.co';
begin
  select decrypted_secret into v_webhook_secret
  from vault.decrypted_secrets
  where name = 'push_webhook_secret'
  limit 1;

  if coalesce(v_webhook_secret, '') = '' then
    raise log 'Push webhook secret is not configured; notification % was not pushed', new.id;
    return new;
  end if;

  perform net.http_post(
    url := v_project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notificacoes',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', null
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

-- A funcao e usada apenas pelo trigger; nao deve ser chamada pela API publica.
revoke all on function public.encaminhar_notificacao_push() from public, anon, authenticated;

drop trigger if exists trg_encaminhar_notificacao_push on public.notificacoes;
create trigger trg_encaminhar_notificacao_push
after insert on public.notificacoes
for each row execute function public.encaminhar_notificacao_push();
