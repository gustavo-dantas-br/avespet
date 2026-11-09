-- Achados por anilha: foto da ave encontrada + endereco de onde foi encontrada
-- Aditivo: so adiciona 2 colunas e troca a funcao por uma versao com 2 parametros a mais.

alter table achados_anilha add column if not exists endereco text;
alter table achados_anilha add column if not exists foto text;

-- Remove a versao antiga (4 parametros) pra nao haver ambiguidade na chamada
drop function if exists registrar_achado_anilha(text, text, text, text);

create or replace function registrar_achado_anilha(
  p_anilha text,
  p_nome text,
  p_telefone text,
  p_mensagem text,
  p_endereco text default '',
  p_foto text default ''
)
returns void
language plpgsql
security definer
as $$
declare
  v_owner uuid;
  v_nome_ave text;
begin
  select user_id, data->>'nome' into v_owner, v_nome_ave
  from aves
  where data->>'anilha' ilike '%' || p_anilha || '%'
  limit 1;

  insert into achados_anilha (
    anilha_buscada, nome_encontrador, telefone_encontrador, mensagem,
    endereco, foto, owner_user_id, ave_nome
  )
  values (
    p_anilha, p_nome, p_telefone, p_mensagem,
    nullif(p_endereco, ''), nullif(p_foto, ''), v_owner, v_nome_ave
  );
end;
$$;

grant execute on function registrar_achado_anilha(text, text, text, text, text, text) to anon, authenticated;
