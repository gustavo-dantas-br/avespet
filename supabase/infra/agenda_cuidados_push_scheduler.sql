-- Gera uma notificação por criador/produto/data/fase, reaproveitando o pipeline push já existente.
-- Fases: véspera, dia programado e primeiro aviso de atraso. Não repete atraso diariamente.
create or replace function public.agenda_cuidados_gerar_notificacoes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_inserted integer := 0;
begin
  with pendentes as (
    select
      c.user_id,
      c.ave_id,
      c.id,
      c.tipo,
      c.produto,
      c.proxima_data,
      coalesce(nullif(btrim(a.nome), ''), nullif(btrim(a.anilha), ''), 'Ave') as nome
    from public.ave_cuidados_registros c
    join public.aves a on a.id = c.ave_id and a.user_id = c.user_id
    where c.proxima_data is not null
      and c.proxima_data <= v_today + 1
      and not exists (
        select 1
        from public.ave_cuidados_registros newer
        where newer.user_id = c.user_id
          and newer.ave_id = c.ave_id
          and newer.tipo = c.tipo
          and lower(btrim(newer.produto)) = lower(btrim(c.produto))
          and newer.data_aplicacao <= v_today
          and (
            newer.data_aplicacao > c.data_aplicacao
            or (newer.data_aplicacao = c.data_aplicacao and newer.created_at > c.created_at)
          )
      )
  ),
  grupos as (
    select
      user_id,
      tipo,
      lower(btrim(produto)) as produto_chave,
      min(produto) as produto,
      proxima_data,
      case
        when proxima_data < v_today then 'atrasado'
        when proxima_data = v_today then 'hoje'
        else 'amanha'
      end as fase,
      count(distinct ave_id)::integer as total_aves,
      array_agg(distinct nome order by nome) as nomes,
      min(id::text)::uuid as referencia_id
    from pendentes
    group by user_id, tipo, lower(btrim(produto)), proxima_data
  ),
  novas as (
    insert into public.notificacoes (
      user_id, audience, tipo, titulo, mensagem,
      referencia_tipo, referencia_id, chave_evento
    )
    select
      g.user_id,
      'cliente',
      'lembrete_cuidado',
      'Lembrete de ' || case when g.tipo = 'vitamina' then 'vitamina' else 'medicamento' end,
      format(
        '%s "%s" %s para %s ave(s): %s. Confira os cuidados no Avespet.',
        initcap(g.tipo),
        g.produto,
        case
          when g.fase = 'atrasado' then 'tem data ultrapassada desde ' || to_char(g.proxima_data, 'DD/MM/YYYY')
          when g.fase = 'hoje' then 'está programada para hoje'
          else 'está programada para amanhã'
        end,
        g.total_aves,
        array_to_string(g.nomes[1:5], ', ') ||
          case when cardinality(g.nomes) > 5 then format(' e mais %s ave(s)', cardinality(g.nomes) - 5) else '' end
      ),
      'agenda_cuidado',
      g.referencia_id,
      'agenda-cuidado:' || g.user_id::text || ':' ||
        md5(g.tipo || '|' || g.produto_chave) || ':' ||
        g.proxima_data::text || ':' || g.fase
    from grupos g
    on conflict (chave_evento) do nothing
    returning id
  )
  select count(*)::integer into v_inserted from novas;

  return v_inserted;
end;
$$;

revoke all on function public.agenda_cuidados_gerar_notificacoes() from public, anon, authenticated;
grant execute on function public.agenda_cuidados_gerar_notificacoes() to service_role;

-- Uma execução diária às 10h de São Paulo (13h UTC).
do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid from cron.job where jobname = 'avespet-care-reminders-daily'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'avespet-care-reminders-daily',
    '0 13 * * *',
    'select public.agenda_cuidados_gerar_notificacoes();'
  );
end;
$$;
