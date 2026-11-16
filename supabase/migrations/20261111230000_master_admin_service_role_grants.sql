-- Permite que Edge Functions confiáveis criem/removam uma autorização Master.
-- O navegador continua sem INSERT/UPDATE/DELETE; a autorização é validada no servidor.
grant insert, delete on table public.master_admins to service_role;
