-- Uma verificação diária às 11h em São Paulo (14h UTC).
-- Chave de chamada fica exclusivamente no Vault do Supabase.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule(
 'avespet-reengagement-daily',
 '0 14 * * *',
 $job$
 select net.http_post(
   url := 'https://tnnpzitijvklbnwptsuq.supabase.co/functions/v1/reengage-creators',
   headers := jsonb_build_object(
     'Content-Type', 'application/json',
     'x-avespet-scheduler', (
       select decrypted_secret from vault.decrypted_secrets
       where name = 'avespet_reengagement_scheduler'
       limit 1
     )
   ),
   body := '{}'::jsonb,
   timeout_milliseconds := 12000
 );
 $job$
);
