-- Regras de acesso aos módulos premium: genética, reprodução e financeiro.
-- As permissões são avaliadas no PostgreSQL e respeitam exceções individuais do Master.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.creator_has_feature(p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_features jsonb;
  v_override jsonb;
  v_expiry timestamptz;
  v_enabled boolean;
begin
  -- Chamadas internas confiáveis podem operar normalmente.
  if v_role = 'service_role' then
    return true;
  end if;
  if v_user_id is null or p_feature not in (
    'basic_profile','basic_bird_management','basic_ads','advanced_genetics',
    'reproduction_management','financial_management','campaigns','after_sales'
  ) then
    return false;
  end if;

  select p.features into v_features
  from public.creator_subscriptions s
  join public.platform_plans p on p.id = s.plan_id
  where s.user_id = v_user_id
    and s.status in ('active','trialing')
    and s.starts_at <= now()
    and (s.ends_at is null or s.ends_at > now())
    and p.is_active = true
  order by s.created_at desc
  limit 1;

  if not found then
    select p.features into v_features
    from public.platform_plans p
    where p.code = 'free' and p.is_active = true
    limit 1;
  end if;

  if v_features is null then
    return false;
  end if;

  select o.feature_overrides, o.expires_at
    into v_override, v_expiry
  from public.creator_entitlement_overrides o
  where o.user_id = v_user_id
  limit 1;

  if found and (v_expiry is null or v_expiry > now())
     and jsonb_typeof(v_override -> p_feature) = 'boolean' then
    return (v_override ->> p_feature)::boolean;
  end if;

  return coalesce((v_features ->> p_feature)::boolean, false);
end;
$$;

revoke all on function private.creator_has_feature(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.creator_has_feature(text) to authenticated;

-- Policies RESTRICTIVE somam-se às políticas de propriedade já existentes.
-- Assim o usuário continua vendo apenas os próprios registros, e também
-- precisa ter o recurso liberado pelo plano ou pelo Master.
do $$
begin
  if to_regclass('public.mutacoes') is not null then
    execute 'alter table public.mutacoes enable row level security';
    execute 'drop policy if exists "creator_owns_mutacoes" on public.mutacoes';
    execute 'create policy "creator_owns_mutacoes" on public.mutacoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'drop policy if exists "plano permite genetica" on public.mutacoes';
    execute 'create policy "plano permite genetica" on public.mutacoes as restrictive for all to authenticated using ((select private.creator_has_feature(''advanced_genetics''))) with check ((select private.creator_has_feature(''advanced_genetics'')))';
  end if;

  if to_regclass('public.posturas') is not null then
    execute 'alter table public.posturas enable row level security';
    execute 'drop policy if exists "creator_owns_posturas" on public.posturas';
    execute 'create policy "creator_owns_posturas" on public.posturas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'drop policy if exists "plano permite reproducao" on public.posturas';
    execute 'create policy "plano permite reproducao" on public.posturas as restrictive for all to authenticated using ((select private.creator_has_feature(''reproduction_management''))) with check ((select private.creator_has_feature(''reproduction_management'')))';
  end if;

  if to_regclass('public.despesas') is not null then
    execute 'alter table public.despesas enable row level security';
    execute 'drop policy if exists "creator_owns_despesas" on public.despesas';
    execute 'create policy "creator_owns_despesas" on public.despesas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'drop policy if exists "plano permite financeiro" on public.despesas';
    execute 'create policy "plano permite financeiro" on public.despesas as restrictive for all to authenticated using ((select private.creator_has_feature(''financial_management''))) with check ((select private.creator_has_feature(''financial_management'')))';
  end if;
end;
$$;

comment on function private.creator_has_feature(text) is
  'Retorna acesso efetivo a um recurso, combinando plano vigente e exceção individual não expirada do Painel Master.';
