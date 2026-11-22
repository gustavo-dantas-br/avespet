-- Proposta NÃO aplicada. Validar em ambiente isolado com duas contas antes de habilitar.
begin;
create table public.avespet_ia_preferencias (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nivel text not null default 'iniciante' check(nivel in ('iniciante','intermediario','experiente')),
 ave_ativa_id uuid references public.aves(id) on delete set null,
 atualizado_em timestamptz not null default now()
);
create table public.avespet_ia_perfis_ave (
 user_id uuid not null references auth.users(id) on delete cascade,
 ave_id uuid not null references public.aves(id) on delete cascade,
 fase text not null default 'incerta' check(fase in ('papa','transicao','desmamada','incerta')),
 etapa_vida text not null default '' check(etapa_vida in ('','filhote','jovem','adulto')),
 idade_dias integer check(idade_dias between 0 and 30000),
 atualizado_em timestamptz not null default now(),
 primary key(user_id,ave_id)
);
create index on public.avespet_ia_perfis_ave(ave_id);
alter table public.avespet_ia_preferencias enable row level security;
alter table public.avespet_ia_perfis_ave enable row level security;
revoke all on public.avespet_ia_preferencias, public.avespet_ia_perfis_ave from public, anon, authenticated;
grant select,insert,update,delete on public.avespet_ia_preferencias, public.avespet_ia_perfis_ave to authenticated;
create policy preferencias_proprias on public.avespet_ia_preferencias for all to authenticated
 using(user_id=(select auth.uid()) and (ave_ativa_id is null or exists(select 1 from public.aves a where a.id=ave_ativa_id and a.user_id=(select auth.uid()))))
 with check(user_id=(select auth.uid()) and (ave_ativa_id is null or exists(select 1 from public.aves a where a.id=ave_ativa_id and a.user_id=(select auth.uid()))));
create policy perfil_ave_proprio on public.avespet_ia_perfis_ave for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid())))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.aves a where a.id=ave_id and a.user_id=(select auth.uid())));
commit;
-- Nome, nascimento, sexo, cor e foto continuam exclusivamente no plantel.
-- Perfil manual permanece local; sem migração automática de dados do navegador.
