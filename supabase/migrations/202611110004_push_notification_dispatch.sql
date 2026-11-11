-- Encaminha novas notificacoes para a Edge Function via pg_net.
-- Os dois segredos abaixo devem ser cadastrados no Supabase Vault:
-- push_service_role_key e push_webhook_secret.
create or replace function public.encaminhar_notificacao_push()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_service_key text;
  v_webhook_secret text;
  v_project_url text := 'https://tnnpzitijvklbnwptsuq.supabase.co';
begin
  select decrypted_secret into v_service_key
  from vault.decrypted_secrets
  where name = 'push_service_role_key'
  limit 1;

  select decrypted_secret into v_webhook_secret
  from vault.decrypted_secrets
  where name = 'push_webhook_secret'
  limit 1;

  if coalesce(v_service_key, '') = '' or coalesce(v_webhook_secret, '') = '' then
    raise log 'Push webhook secrets are not configured; notification % was not pushed', new.id;
    return new;
  end if;

  perform net.http_post(
    url := v_project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key,
      'apikey', v_service_key,
      'x-webhook-secret', v_webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notificacoes',
      'record', to_jsonb(new)
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

drop trigger if exists trg_encaminhar_notificacao_push on public.notificacoes;
create trigger trg_encaminhar_notificacao_push
after insert on public.notificacoes
for each row execute function public.encaminhar_notificacao_push();
