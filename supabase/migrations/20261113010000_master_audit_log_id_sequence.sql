-- Garante geração automática de IDs para o histórico administrativo.
-- A tabela já possui registros; a sequência é inicializada a partir do maior ID existente.
create sequence if not exists public.master_audit_log_id_seq;

select setval(
  'public.master_audit_log_id_seq',
  coalesce((select max(id) from public.master_audit_log), 0),
  (select count(*) > 0 from public.master_audit_log)
);

alter table public.master_audit_log
  alter column id set default nextval('public.master_audit_log_id_seq');

alter sequence public.master_audit_log_id_seq
  owned by public.master_audit_log.id;

grant usage, select on sequence public.master_audit_log_id_seq to service_role;
