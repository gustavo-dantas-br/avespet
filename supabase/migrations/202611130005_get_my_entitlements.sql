-- Consulta segura das permissões efetivas do próprio criador.
-- Usada pela interface para apresentar o plano e ocultar módulos indisponíveis.
create or replace function public.get_my_entitlements()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan jsonb;
  v_features jsonb;
  v_override jsonb := '{}'::jsonb;
  v_expiry timestamptz;
  v_max_birds integer;
  v_unlimited boolean := false;
  v_effective_features jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Autenticação necessária.';
  end if;

  select jsonb_build_object(
    'id', p.id, 'code', p.code, 'name', p.name, 'max_birds', p.max_birds,
    'is_free', p.is_free, 'features', p.features
  ), p.features, p.max_birds
  into v_plan, v_features, v_max_birds
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
    select jsonb_build_object(
      'id', p.id, 'code', p.code, 'name', p.name, 'max_birds', p.max_birds,
      'is_free', p.is_free, 'features', p.features
    ), p.features, p.max_birds
    into v_plan, v_features, v_max_birds
    from public.platform_plans p
    where p.code = 'free' and p.is_active = true
    limit 1;
  end if;

  if v_plan is null then
    raise exception using errcode = 'P0001', message = 'Plano padrão não configurado.';
  end if;

  select coalesce(o.feature_overrides, '{}'::jsonb), o.expires_at,
         o.max_birds_override, o.unlimited_birds_override
  into v_override, v_expiry, v_max_birds, v_unlimited
  from public.creator_entitlement_overrides o
  where o.user_id = v_user_id
  limit 1;

  if not found or (v_expiry is not null and v_expiry <= now()) then
    v_override := '{}'::jsonb;
    v_max_birds := (v_plan ->> 'max_birds')::integer;
    v_unlimited := false;
  else
    if not v_unlimited and v_max_birds is null then
      v_max_birds := (v_plan ->> 'max_birds')::integer;
    end if;
  end if;

  select coalesce(jsonb_object_agg(k,
    case when jsonb_typeof(v_override -> k) = 'boolean'
         then v_override -> k
         else coalesce(v_features -> k, 'false'::jsonb)
    end
  ), '{}'::jsonb)
  into v_effective_features
  from unnest(array[
    'basic_profile','basic_bird_management','basic_ads','advanced_genetics',
    'reproduction_management','financial_management','campaigns','after_sales'
  ]) as keys(k);

  return jsonb_build_object(
    'plan', v_plan,
    'features', v_effective_features,
    'max_birds', case when v_unlimited then null else v_max_birds end,
    'unlimited_birds', v_unlimited,
    'has_override', v_override <> '{}'::jsonb or v_unlimited or v_max_birds is distinct from (v_plan ->> 'max_birds')::integer
  );
end;
$$;

revoke all on function public.get_my_entitlements() from public, anon;
grant execute on function public.get_my_entitlements() to authenticated;

comment on function public.get_my_entitlements() is
  'Retorna somente ao usuário autenticado suas permissões efetivas, plano e limite, incluindo exceções Master vigentes.';
