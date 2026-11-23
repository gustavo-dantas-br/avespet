-- Tarefas privadas do criador, sem notificações ou automações.
create table if not exists public.agenda_tarefas (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 titulo text not null check (char_length(btrim(titulo)) between 1 and 140),
 categoria text not null default 'manejo' check (categoria in ('manejo','reproducao','saude','posvenda','outro')),
 dia date not null,
 concluida boolean not null default false,
 observacao text check (char_length(observacao) <= 1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists agenda_tarefas_por_usuario_dia on public.agenda_tarefas(user_id,dia);
alter table public.agenda_tarefas enable row level security;
revoke all on public.agenda_tarefas from public,anon;
grant select,insert,update,delete on public.agenda_tarefas to authenticated;
drop policy if exists agenda_tarefas_select_owner on public.agenda_tarefas;
create policy agenda_tarefas_select_owner on public.agenda_tarefas for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists agenda_tarefas_insert_owner on public.agenda_tarefas;
create policy agenda_tarefas_insert_owner on public.agenda_tarefas for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists agenda_tarefas_update_owner on public.agenda_tarefas;
create policy agenda_tarefas_update_owner on public.agenda_tarefas for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists agenda_tarefas_delete_owner on public.agenda_tarefas;
create policy agenda_tarefas_delete_owner on public.agenda_tarefas for delete to authenticated using ((select auth.uid())=user_id);
