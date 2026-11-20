begin;
alter table public.achados_anilha add column if not exists anuncio_perdido_id uuid references public.anuncios_aves_perdidas(id) on delete set null;
create index if not exists achados_anilha_anuncio_idx on public.achados_anilha(anuncio_perdido_id);
-- Retorna somente os campos públicos necessários; nunca contatos ou anilha.
create function public.buscar_ave_perdida_publica(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',a.id,'nomeAve',a.data->'nomeAve','especie',a.data->'especie','cor',a.data->'cor','bairro',a.data->'bairro','cidade',a.data->'cidade','uf',a.data->'uf','dataPerda',a.data->'dataPerda','foto',a.data->'foto','situacao',a.status)
 from public.anuncios_aves_perdidas a where a.id=p_id and a.status in ('aprovado','reencontrado');
$$;
revoke all on function public.buscar_ave_perdida_publica(uuid) from public;
grant execute on function public.buscar_ave_perdida_publica(uuid) to anon,authenticated,service_role;
create function public.registrar_avistamento_vinculado(p_id uuid,p_nome text,p_telefone text,p_local text,p_mensagem text)
returns void language plpgsql security definer set search_path='' as $$
declare a public.anuncios_aves_perdidas%rowtype; n text:=btrim(coalesce(p_nome,'')); t text:=btrim(coalesce(p_telefone,'')); l text:=btrim(coalesce(p_local,'')); m text:=btrim(coalesce(p_mensagem,''));
begin
 if char_length(n) not between 2 and 120 or char_length(t) not between 8 and 30 or char_length(regexp_replace(t,'[^0-9]','','g')) not between 8 and 15 or char_length(l) not between 3 and 500 or char_length(m)>1800 then raise exception 'Revise os dados do avistamento.';end if;
 select * into a from public.anuncios_aves_perdidas where id=p_id and status='aprovado' for share;
 if not found then raise exception 'Busca indisponível ou encerrada.';end if;
 -- Limita repetição imediata por telefone e anúncio; não retorna dados do responsável.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text||regexp_replace(t,'[^0-9]','','g'),0));
 if exists(select 1 from public.achados_anilha h where h.anuncio_perdido_id=p_id and regexp_replace(h.telefone_encontrador,'[^0-9]','','g')=regexp_replace(t,'[^0-9]','','g') and h.criado_em>now()-interval '2 minutes') then raise exception 'Aviso recente já registrado. Aguarde antes de reenviar.';end if;
 insert into public.achados_anilha(anuncio_perdido_id,anilha_buscada,nome_encontrador,telefone_encontrador,mensagem,endereco,owner_user_id,ave_nome)
 values(p_id,'AVISTAMENTO',n,t,'Avistamento vinculado à busca '||p_id::text||E'\n'||m,l,a.user_id,coalesce(a.data->>'nomeAve',a.data->>'especie','Ave perdida'));
end $$;
revoke all on function public.registrar_avistamento_vinculado(uuid,text,text,text,text) from public;
grant execute on function public.registrar_avistamento_vinculado(uuid,text,text,text,text) to anon,authenticated;
commit;