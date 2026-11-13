-- Aplica no banco o limite de aves do plano com exceções individuais do Master.
-- A validação ocorre no PostgreSQL e não pode ser contornada pela interface.

create or replace function public.enforce_creator_bird_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_override public.creator_entitlement_overrides%rowtype;
  v_count integer;
begin
  -- Atualizações de aves existentes não consomem uma nova vaga.
  if tg_op = 'UPDATE' then
    return new;
  end if;

  -- Requisições autenticadas só podem inserir aves na própria conta.
  -- Chamadas confiáveis com service_role podem operar sem auth.uid().
  if auth.uid() is not null and auth.uid() <> new.user_id then
    raise exception using
      errcode = '42501',
      message = 'Não é permitido cadastrar aves para outra conta.';
  end if;

  -- Serializa inserções concorrentes do mesmo criador para impedir
  -- que duas requisições simultâneas ultrapassem o limite.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  -- O upsert usado pelo sistema pode passar pelo INSERT antes do UPDATE.
  -- Se o ID já pertence ao criador, não é um novo registro.
  if exists (
    select 1 from public.aves
    where id = new.id and user_id = new.user_id
  ) then
    return new;
  end if;

  -- Assinatura válida no momento da inclusão.
  select p.max_birds
    into v_limit
  from public.creator_subscriptions s
  join public.platform_plans p on p.id = s.plan_id
  where s.user_id = new.user_id
    and s.status in ('active', 'trialing')
    and s.starts_at <= now()
    and (s.ends_at is null or s.ends_at > now())
    and p.is_active = true
  order by s.created_at desc
  limit 1;

  -- Sem assinatura vigente, aplica o plano gratuito padrão.
  if not found then
    select p.max_birds
      into v_limit
    from public.platform_plans p
    where p.code = 'free' and p.is_active = true
    limit 1;

    if not found then
      raise exception using
        errcode = 'P0001',
        message = 'Não foi possível validar o plano da conta. Entre em contato com o suporte.';
    end if;
  end if;

  -- Exceções do Master prevalecem sobre o plano enquanto estiverem válidas.
  select *
    into v_override
  from public.creator_entitlement_overrides o
  where o.user_id = new.user_id
    and (o.expires_at is null or o.expires_at > now())
  limit 1;

  if found then
    if v_override.unlimited_birds_override then
      return new;
    end if;
    if v_override.max_birds_override is not null then
      v_limit := v_override.max_birds_override;
    end if;
  end if;

  -- NULL significa ilimitado.
  if v_limit is null then
    return new;
  end if;

  select count(*)::integer
    into v_count
  from public.aves a
  where a.user_id = new.user_id;

  if v_count >= v_limit then
    raise exception using
      errcode = 'P0001',
      message = format('Limite de %s aves atingido no plano atual.', v_limit),
      detail = 'O Painel Master pode conceder um limite especial para esta conta.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_creator_bird_limit() from public, anon, authenticated;

drop trigger if exists enforce_creator_bird_limit_before_write on public.aves;
create trigger enforce_creator_bird_limit_before_write
before insert or update on public.aves
for each row execute function public.enforce_creator_bird_limit();

comment on function public.enforce_creator_bird_limit() is
  'Aplica limite de aves de plano ou exceção válida do Master diretamente no PostgreSQL.';
