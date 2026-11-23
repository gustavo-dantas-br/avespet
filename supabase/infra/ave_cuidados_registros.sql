-- Histórico de administração informado pelo criador, não prescrição.
create table if not exists public.ave_cuidados_registros (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 ave_id uuid not null references public.aves(id) on delete cascade,
 tipo text not null check (tipo in ('medicamento','vitamina')),
 produto text not null check (char_length(btrim(produto)) between 1 and 140),
 data_aplicacao date not null,
 proxima_data date check (proxima_data is null or proxima_data >= data_aplicacao),
 quantidade_informada text check (char_length(quantidade_informada)<=120),
 observacao text check (char_length(observacao)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint ave_cuidados_owner_match check (user_id is not null)
);
create index if not exists idx_ave_cuidados_user_data on public.ave_cuidados_registros(user_id,data_aplicacao desc);
create index if not exists idx_ave_cuidados_user_proxima on public.ave_cuidados_registros(user_id,proxima_data) where proxima_data is not null;
alter table public.ave_cuidados_registros enable row level security;
revoke all on public.ave_cuidados_registros from public,anon;
grant select,insert,update,delete on public.ave_cuidados_registros to authenticated;
drop policy if exists ave_cuidados_select on public.ave_cuidados_registros;
create policy ave_cuidados_select on public.ave_cuidados_registros for select to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid())));
drop policy if exists ave_cuidados_insert on public.ave_cuidados_registros;
create policy ave_cuidados_insert on public.ave_cuidados_registros for insert to authenticated
 with check (user_id=(select auth.uid()) and exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid())));
drop policy if exists ave_cuidados_update on public.ave_cuidados_registros;
create policy ave_cuidados_update on public.ave_cuidados_registros for update to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid())))
 with check (user_id=(select auth.uid()) and exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid())));
drop policy if exists ave_cuidados_delete on public.ave_cuidados_registros;
create policy ave_cuidados_delete on public.ave_cuidados_registros for delete to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid())));
