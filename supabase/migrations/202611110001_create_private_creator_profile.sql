create table if not exists public.perfil_criador_privado (
  user_id uuid primary key references auth.users(id) on delete cascade,
  endereco text not null default '',
  numero text not null default '',
  complemento text not null default '',
  bairro text not null default '',
  cidade text not null default '',
  uf text not null default '',
  cep text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.perfil_criador_privado enable row level security;

create policy "criador ve seus dados privados"
on public.perfil_criador_privado for select
to authenticated
using (auth.uid() = user_id);

create policy "criador cadastra seus dados privados"
on public.perfil_criador_privado for insert
to authenticated
with check (auth.uid() = user_id);

create policy "criador atualiza seus dados privados"
on public.perfil_criador_privado for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "admin consulta dados privados"
on public.perfil_criador_privado for select
to authenticated
using (exists (select 1 from public.admins where admins.user_id = auth.uid()));
