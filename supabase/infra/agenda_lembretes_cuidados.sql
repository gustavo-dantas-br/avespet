-- Lembretes em leitura: não há job, envio push ou administração automática.
-- SECURITY INVOKER usa RLS da tabela ave_cuidados_registros e auth.uid().
create or replace function public.agenda_lembretes_cuidados()
returns table(id uuid,ave_id uuid,tipo text,produto text,data_aplicacao date,proxima_data date)
language sql stable security invoker set search_path = ''
as $$
 select c.id,c.ave_id,c.tipo,c.produto,c.data_aplicacao,c.proxima_data
 from public.ave_cuidados_registros c
 where c.user_id=(select auth.uid())
 and c.proxima_data is not null
 and c.proxima_data <= (now() at time zone 'America/Sao_Paulo')::date+1
 and exists (select 1 from public.aves a where a.id=c.ave_id and a.user_id=(select auth.uid()))
 and not exists (
  select 1 from public.ave_cuidados_registros newer
  where newer.user_id=c.user_id and newer.ave_id=c.ave_id
  and newer.tipo=c.tipo and lower(btrim(newer.produto))=lower(btrim(c.produto))
  and newer.data_aplicacao <= (now() at time zone 'America/Sao_Paulo')::date
  and (newer.data_aplicacao>c.data_aplicacao
       or (newer.data_aplicacao=c.data_aplicacao and newer.created_at>c.created_at))
 )
 order by c.proxima_data,c.produto,c.ave_id limit 500;
$$;
revoke all on function public.agenda_lembretes_cuidados() from public,anon;
grant execute on function public.agenda_lembretes_cuidados() to authenticated;
