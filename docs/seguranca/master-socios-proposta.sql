-- Proposta de homologação: não executar automaticamente em produção.
-- Preserva todas as contas e permissões Master atuais.
begin;
lock table public.master_admins in access exclusive mode;
alter table public.master_admins add column papel text not null default 'master';
alter table public.master_admins add constraint master_admins_papel_check check (papel in ('owner','master'));
-- Bootstrap inicial deliberadamente restrito a um único Master existente.
do $$
begin
  if (select count(*) from public.master_admins) <> 1 then
    raise exception 'Bootstrap exige conferência manual: quantidade de Masters diferente de um';
  end if;
  update public.master_admins set papel='owner';
end $$;
create unique index master_admins_um_proprietario on public.master_admins(papel) where papel='owner';
-- Clientes não podem escrever diretamente na tabela de permissões.
revoke insert, update, delete, truncate on public.master_admins from public, anon, authenticated;
-- Impede a remoção ou alteração do proprietário por operações administrativas comuns.
create or replace function public.proteger_proprietario_master()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.papel = 'owner' then
    if tg_op = 'DELETE' then raise exception 'Proprietario protegido'; end if;
    if new.papel is distinct from old.papel or new.user_id is distinct from old.user_id then
      raise exception 'Proprietario protegido';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.proteger_proprietario_master() from public, anon, authenticated;
create trigger proteger_proprietario_master before update or delete on public.master_admins
for each row execute function public.proteger_proprietario_master();
-- Executável somente pelo backend service_role. Verifica o proprietário novamente dentro da transação.
create function public.master_alterar_acesso(p_actor uuid,p_target uuid,p_grant boolean,p_reason text)
returns void language plpgsql security invoker set search_path='' as $master$
begin
  lock table public.master_admins in share row exclusive mode;
  if not exists(select 1 from public.master_admins where user_id=p_actor and papel='owner') then
    raise exception 'Proprietario obrigatorio';
  end if;
  if p_actor=p_target or p_target is null or p_grant is null or length(trim(coalesce(p_reason,''))) < 8 then
    raise exception 'Operacao invalida';
  end if;
  if p_grant then
    -- A chave estrangeira existente master_admins_user_id_fkey valida a conta sem SELECT em auth.users.
    insert into public.master_admins(user_id,papel) values(p_target,'master');
  else
    delete from public.master_admins where user_id=p_target and papel='master';
    if not found then raise exception 'Autorizacao inexistente ou protegida'; end if;
  end if;
  insert into public.master_audit_log(actor_user_id,action,resource_type,resource_id,metadata)
  values(p_actor,case when p_grant then 'master_access_granted' else 'master_access_revoked' end,'master_access',p_target::text,jsonb_build_object('reason',left(trim(p_reason),500)));
end $master$;
revoke all on function public.master_alterar_acesso(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.master_alterar_acesso(uuid,uuid,boolean,text) to service_role;
commit;
-- A gestão de convites e revogação deve validar o proprietário no servidor.
-- Revogar apenas a autorização Master, nunca excluir auth.users ou dados do criador.
-- Validar atomicidade da auditoria, concorrência e bloqueios antes de publicar.
