-- Bloqueia alterações de pós-venda no JSON das aves sem o recurso liberado.
-- O restante dos dados da ave continua podendo ser editado normalmente.
create or replace function private.enforce_after_sales_feature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if (
    new.data -> 'statusPosVenda' is distinct from old.data -> 'statusPosVenda'
    or new.data -> 'clienteSatisfeito' is distinct from old.data -> 'clienteSatisfeito'
    or new.data -> 'dataEntrega' is distinct from old.data -> 'dataEntrega'
    or new.data -> 'dataUltimoContato' is distinct from old.data -> 'dataUltimoContato'
    or new.data -> 'obsPosVenda' is distinct from old.data -> 'obsPosVenda'
  ) and not private.creator_has_feature('after_sales') then
    raise exception using
      errcode = '42501',
      message = 'O módulo de pós-venda não está liberado no seu plano.',
      detail = 'Solicite ao responsável pelo AvesPet a liberação deste recurso.';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_after_sales_feature() from public, anon, authenticated;

drop trigger if exists enforce_after_sales_feature_before_update on public.aves;
create trigger enforce_after_sales_feature_before_update
before update of data on public.aves
for each row execute function private.enforce_after_sales_feature();

comment on function private.enforce_after_sales_feature() is
  'Impede alteração dos campos de pós-venda quando o plano ou exceção Master não concede esse recurso.';
