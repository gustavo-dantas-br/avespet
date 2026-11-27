create or replace function public.master_notifications_infra_alerts()
returns table(id uuid, metric text, level integer, pct numeric, status text, created_at timestamptz)
language sql
security definer
set search_path = pg_catalog, avespet_infra
as $$
  select a.id, a.metric, a.level, a.pct, a.status, a.created_at
  from avespet_infra.alert_outbox a
  where a.status in ('pending','failed','uncertain')
    and a.created_at >= now() - interval '30 days'
  order by a.created_at desc
  limit 100;
$$;
revoke all on function public.master_notifications_infra_alerts() from public, anon, authenticated;
grant execute on function public.master_notifications_infra_alerts() to service_role;
