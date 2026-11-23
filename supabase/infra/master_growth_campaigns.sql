create table if not exists avespet_infra.growth_campaigns(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(btrim(name)) between 1 and 120),
 channel text not null check(channel in ('instagram','facebook','google','whatsapp','youtube','outro')),
 status text not null default 'planned' check(status in ('planned','active','paused','finished')),
 starts_on date not null, ends_on date check(ends_on>=starts_on),
 budget_cents bigint check(budget_cents between 0 and 100000000),
 spent_cents bigint check(spent_cents between 0 and 100000000),
 leads integer check(leads between 0 and 10000000),
 signups integer check(signups between 0 and 10000000),
 updated_at timestamptz not null default now()
);
alter table avespet_infra.growth_campaigns enable row level security;
revoke all on avespet_infra.growth_campaigns from public,anon,authenticated;
create or replace function public.master_growth_campaigns(p_actor uuid,p_action text default 'list',p_payload jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r avespet_infra.growth_campaigns%rowtype;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_action in ('create','update') then
 if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Invalid payload'; end if;
 if p_action='create' then
 insert into avespet_infra.growth_campaigns(name,channel,status,starts_on,ends_on,budget_cents,spent_cents,leads,signups)
 values(btrim(p_payload->>'name'),p_payload->>'channel',p_payload->>'status',(p_payload->>'starts_on')::date,nullif(p_payload->>'ends_on','')::date,(p_payload->>'budget_cents')::bigint,(p_payload->>'spent_cents')::bigint,(p_payload->>'leads')::integer,(p_payload->>'signups')::integer) returning * into r;
 else
 update avespet_infra.growth_campaigns set name=btrim(p_payload->>'name'),channel=p_payload->>'channel',status=p_payload->>'status',starts_on=(p_payload->>'starts_on')::date,ends_on=nullif(p_payload->>'ends_on','')::date,budget_cents=(p_payload->>'budget_cents')::bigint,spent_cents=(p_payload->>'spent_cents')::bigint,leads=(p_payload->>'leads')::integer,signups=(p_payload->>'signups')::integer,updated_at=now() where id=(p_payload->>'id')::uuid returning * into r;
 if not found then raise exception 'Not found'; end if;
 end if;
 insert into public.master_audit_log(actor_user_id,action,resource_type,resource_id,metadata) values(p_actor,'growth_campaign_'||p_action,'growth_campaign',r.id::text,jsonb_build_object('status',r.status,'budget_cents',r.budget_cents,'spent_cents',r.spent_cents,'leads',r.leads,'signups',r.signups));
 elsif p_action<>'list' then raise exception 'Invalid operation'; end if;
 return jsonb_build_object('rows',(select coalesce(jsonb_agg(to_jsonb(c) order by c.starts_on desc,c.id),'[]'::jsonb) from (select * from avespet_infra.growth_campaigns order by starts_on desc,id limit 200)c),'total',(select count(*) from avespet_infra.growth_campaigns));
end $$;
revoke all on function public.master_growth_campaigns(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.master_growth_campaigns(uuid,text,jsonb) to service_role;
