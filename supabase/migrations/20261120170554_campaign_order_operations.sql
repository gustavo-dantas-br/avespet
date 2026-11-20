begin;
-- Operação privada, sem alterar a tabela de solicitações públicas.
create table public.campaign_order_operations (
 order_id uuid primary key references public.solicitacoes_campanhas_aves(id),
 package_snapshot jsonb not null,
 contracted_cents integer not null check(contracted_cents between 0 and 10000000),
 payment_confirmed_at timestamptz,
 started_at timestamptz,
 ended_at timestamptz,
 actual_media_cents integer check(actual_media_cents>=0),
 actual_reach integer check(actual_reach>=0),
 impressions integer check(impressions>=0),
 recovered boolean,
 notes text not null default '' check(char_length(notes)<=2000),
 updated_at timestamptz not null default now(),
 check(ended_at is null or (started_at is not null and ended_at>=started_at)),
 check(started_at is null or payment_confirmed_at is not null),
 check(impressions is null or actual_reach is null or impressions>=actual_reach)
);
alter table public.campaign_order_operations enable row level security;
revoke all on public.campaign_order_operations from public,anon,authenticated;
grant select,insert,update on public.campaign_order_operations to service_role;
create table public.campaign_order_events (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.campaign_order_operations(order_id),
 actor_id uuid not null references auth.users(id),
 event_type text not null,
 details jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.campaign_order_events enable row level security;
revoke all on public.campaign_order_events from public,anon,authenticated;
grant select,insert on public.campaign_order_events to service_role;
grant usage,select on sequence public.campaign_order_events_id_seq to service_role;
create index campaign_order_events_order_idx on public.campaign_order_events(order_id,created_at desc);
-- O catálogo é copiado uma única vez na confirmação explícita do orçamento.
-- Pedidos antigos nunca recebem automaticamente uma nova condição comercial.
create function public.master_campaign_order_action(p_actor uuid,p_order uuid,p_action text,p_payload jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare o public.solicitacoes_campanhas_aves%rowtype; x public.campaign_order_operations%rowtype;
 pkg public.campaign_packages%rowtype; snap jsonb; price integer; next_status text; moment timestamptz:=now();
begin
 if not exists(select 1 from public.master_admins where user_id=p_actor) then raise exception 'Acesso negado';end if;
 select * into o from public.solicitacoes_campanhas_aves where id=p_order for update;
 if not found then raise exception 'Pedido não encontrado';end if;
 select * into x from public.campaign_order_operations where order_id=p_order for update;
 if p_action='quote' then
   if x.order_id is not null or o.status not in ('solicitada','em_orcamento','aguardando_pagamento') then raise exception 'Orçamento já registrado ou pedido indisponível';end if;
   select * into pkg from public.campaign_packages where code=o.pacote;
   if not found then raise exception 'Pacote indisponível';end if;
   price:=(p_payload->>'contracted_cents')::integer;
   if price is null or price<0 or price>10000000 then raise exception 'Preço inválido';end if;
   if pkg.media_cents>price then raise exception 'Valor contratado inferior à verba Meta';end if;
   snap:=jsonb_build_object('code',pkg.code,'name',coalesce(o.catalog_snapshot->>'name',pkg.name),'price_cents',price,'duration_days',coalesce((o.catalog_snapshot->>'duration_days')::integer,pkg.duration_days),'radius_km',coalesce((o.catalog_snapshot->>'radius_km')::integer,pkg.radius_km),'media_cents',pkg.media_cents,'media_tax_bps',pkg.media_tax_bps,'operating_cents',pkg.operating_cents,'company_tax_bps',pkg.company_tax_bps,'snapshot_at',moment,'source','catalog_at_quote');
   insert into public.campaign_order_operations(order_id,package_snapshot,contracted_cents) values(p_order,snap,price);
   next_status:='aguardando_pagamento';
 elsif x.order_id is null then raise exception 'Registre o orçamento primeiro';
 elsif p_action='pay' and o.status='aguardando_pagamento' and x.payment_confirmed_at is null then
   update public.campaign_order_operations set payment_confirmed_at=moment,updated_at=moment where order_id=p_order;
   next_status:='paga';
 elsif p_action='start' and o.status='paga' and x.payment_confirmed_at is not null and x.started_at is null then
   update public.campaign_order_operations set started_at=moment,updated_at=moment where order_id=p_order;
   next_status:='em_execucao';
 elsif p_action in ('metrics','finish') and o.status='em_execucao' and x.started_at is not null then
   update public.campaign_order_operations set actual_media_cents=(p_payload->>'actual_media_cents')::integer,
   actual_reach=(p_payload->>'actual_reach')::integer,impressions=(p_payload->>'impressions')::integer,
   recovered=(p_payload->>'recovered')::boolean,notes=coalesce(p_payload->>'notes',''),
   ended_at=case when p_action='finish' then moment else ended_at end,updated_at=moment where order_id=p_order;
   next_status:=case when p_action='finish' then 'concluida' else o.status end;
 elsif p_action='cancel' and o.status='aguardando_pagamento' and x.payment_confirmed_at is null then next_status:='cancelada';
 else raise exception 'Transição não permitida';end if;
 update public.solicitacoes_campanhas_aves set status=next_status,valor=case when p_action='quote' then price::numeric/100 else valor end,atualizado_em=moment where id=p_order;
 insert into public.campaign_order_events(order_id,actor_id,event_type,details) values(p_order,p_actor,p_action,jsonb_build_object('from',o.status,'to',next_status,'payload',p_payload));
end $$;
revoke all on function public.master_campaign_order_action(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.master_campaign_order_action(uuid,uuid,text,jsonb) to service_role;
commit;