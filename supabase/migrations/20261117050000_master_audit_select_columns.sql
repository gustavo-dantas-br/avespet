-- Privilégios de leitura já concedidos ao backend na implantação Master.
GRANT SELECT (id, actor_user_id, action, created_at, resource_type, resource_id)
 ON TABLE public.master_audit_log TO service_role;
