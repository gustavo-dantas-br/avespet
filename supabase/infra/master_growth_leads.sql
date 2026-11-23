-- Manual commercial leads only. No automatic import of users or marketing sends.
create table if not exists avespet_infra.growth_leads(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 120),
 contact text not null check(length(contact) between 1 and 160),
 source text not null check(source in ('instagram','facebook','google','whatsapp','youtube','indicacao','outro')),
 stage text not null default 'new' check(stage in ('new','contacted','negotiating','won','lost')),
 next_contact date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table avespet_infra.growth_leads enable row level security;
revoke all on avespet_infra.growth_leads from public,anon,authenticated;
create or replace function public.master_growth_leads(p_actor uuid,p_action text default 'list',p_payload jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r avespet_infra.growth_leads%rowtype; lead_id uuid; v_name text; v_contact text; v_source text; v_stage text; v_date date;
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_action='create' then
  v_name:=btrim(p_payload->>'name');v_contact:=btrim(p_payload->>'contact');v_source:=p_payload->>'source';
  if v_name is null or v_contact is null then raise exception 'Invalid lead'; end if;
  if exists(select 1 from avespet_infra.growth_leads where lower(contact)=lower(v_contact)) then raise exception 'Duplicate contact'; end if;
  insert into avespet_infra.growth_leads(name,contact,source,next_contact) values(v_name,v_contact,v_source,nullif(p_payload->>'next_contact','')::date) returning * into r;
 elsif p_action='update' then
  lead_id:=(p_payload->>'id')::uuid;v_stage:=p_payload->>'stage';v_date:=nullif(p_payload->>'next_contact','')::date;
  update avespet_infra.growth_leads set stage=v_stage,next_contact=v_date,updated_at=now() where id=lead_id returning * into r;
  if not found then raise exception 'Lead not found'; end if;
 elsif p_action='delete' then
  delete from avespet_infra.growth_leads where id=(p_payload->>'id')::uuid returning * into r;
  if not found then raise exception 'Lead not found'; end if;
 elsif p_action<>'list' then raise exception 'Invalid action';
 end if;
 if p_action<>'list' then
 insert into public.master_audit_log(actor_user_id,action,resource_type,resource_id,metadata)
 values(p_actor,'growth_lead_'||p_action,'growth_lead',r.id::text,jsonb_build_object('stage',r.stage));
 end if;
 return jsonb_build_object('rows',(select coalesce(jsonb_agg(to_jsonb(l) order by l.created_at desc),'[]'::jsonb) from (select * from avespet_infra.growth_leads order by created_at desc limit 200) l),'total',(select count(*) from avespet_infra.growth_leads),'counts',(select coalesce(jsonb_object_agg(stage,n),'{}'::jsonb) from (select stage,count(*) n from avespet_infra.growth_leads group by stage) s),'today',(now() at time zone 'America/Sao_Paulo')::date);
end $$;
revoke all on function public.master_growth_leads(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.master_growth_leads(uuid,text,jsonb) to service_role;
