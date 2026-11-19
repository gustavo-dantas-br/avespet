-- Agrupa estatísticas administrativas em uma única consulta.
-- A função não contorna RLS: SECURITY INVOKER e EXECUTE apenas para service_role.
-- A Edge Function valida autenticação e permissão Master antes de invocá-la.
create or replace function public.master_dashboard_stats(p_since date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'counts', pg_catalog.jsonb_build_object(
      'admins', (select count(*) from public.admins),
      'perfil_criador', (select count(*) from public.perfil_criador),
      'aves', (select count(*) from public.aves),
      'anuncios', (select count(*) from public.anuncios),
      'anuncios_aves_perdidas', (select count(*) from public.anuncios_aves_perdidas)
    ),
    'visits', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('dia', t.dia, 'total', t.total)
        order by t.dia
      )
      from (
        select dia, sum(total) as total
        from public.visitas_diarias
        where dia >= p_since
        group by dia
      ) t
    ), '[]'::jsonb),
    'adsByStatus', coalesce((
      select pg_catalog.jsonb_object_agg(s.status, s.total)
      from (
        select status, count(*) as total from public.anuncios
        where status is not null group by status
      ) s
    ), '{}'::jsonb),
    'lostAdsByStatus', coalesce((
      select pg_catalog.jsonb_object_agg(s.status, s.total)
      from (
        select status, count(*) as total from public.anuncios_aves_perdidas
        where status is not null group by status
      ) s
    ), '{}'::jsonb)
  );
$$;

revoke all on function public.master_dashboard_stats(date) from public, anon, authenticated;
grant execute on function public.master_dashboard_stats(date) to service_role;
