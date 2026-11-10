-- Teste das regras de seguranca de guias e visitas. Rode no SQL Editor do Supabase DEPOIS
-- de rodar o schema_fase_conteudo.sql. Tudo acontece dentro de uma transacao que e DESFEITA
-- no final (rollback): nao cria, altera nem apaga nada no seu banco.
-- Precisa existir pelo menos 1 admin na tabela admins (voce).

begin;

create temp table resultado (n serial, teste text, obtido text, esperado text, passou text);
create function pg_temp.reg(t text, o text, e text) returns void language sql as $f$
  insert into resultado(teste, obtido, esperado, passou) values (t, o, e, case when o = e then 'OK' else 'FALHOU' end)
$f$;

do $$
declare
  v_admin uuid;
  v_comum uuid := gen_random_uuid();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  n int; r text; antes int; depois int;
  total_de text := 'select coalesce((select total from visitas_diarias where dia = $1 and caminho = $2), 0)';
begin
  select user_id into v_admin from admins limit 1;
  if v_admin is null then raise exception 'A tabela admins esta vazia. Rode o schema_fase_aprovacoes.sql antes.'; end if;

  -- dados de teste (como dono do banco, sem RLS): 1 publicado e 1 rascunho
  insert into artigos (id, slug, titulo, corpo, publicado, publicado_em)
  values (gen_random_uuid(), 'teste-publicado-xyz', 'Pub', 'x', true, now()),
         (gen_random_uuid(), 'teste-rascunho-xyz', 'Rasc', 'x', false, null);

  -- ===== visitante (anon) =====
  set local role anon; perform set_config('request.jwt.claim.sub', '', true);
  select count(*) into n from artigos where slug like 'teste-%-xyz';
  reset role; perform pg_temp.reg('visitante le so os publicados', n::text, '1');

  set local role anon;
  begin insert into artigos (id, slug, titulo, corpo) values (gen_random_uuid(), 'teste-anon-xyz', 'A', 'x'); r := 'inseriu'; exception when others then r := 'barrado'; end;
  reset role; perform pg_temp.reg('visitante NAO consegue criar guia', r, 'barrado');

  set local role anon;
  update artigos set titulo = 'hack' where slug = 'teste-publicado-xyz'; get diagnostics n = row_count;
  reset role; perform pg_temp.reg('visitante NAO consegue editar guia (linhas alteradas)', n::text, '0');

  set local role anon;
  delete from artigos where slug = 'teste-publicado-xyz'; get diagnostics n = row_count;
  reset role; perform pg_temp.reg('visitante NAO consegue apagar guia (linhas apagadas)', n::text, '0');

  set local role anon;
  select count(*) into n from visitas_diarias;
  reset role; perform pg_temp.reg('visitante NAO le as visitas', n::text, '0');

  -- ===== criador comum (logado, nao admin) =====
  set local role authenticated; perform set_config('request.jwt.claim.sub', v_comum::text, true);
  select count(*) into n from artigos where slug like 'teste-%-xyz';
  reset role; perform pg_temp.reg('criador comum le so os publicados', n::text, '1');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_comum::text, true);
  begin insert into artigos (id, slug, titulo, corpo) values (gen_random_uuid(), 'teste-comum-xyz', 'C', 'x'); r := 'inseriu'; exception when others then r := 'barrado'; end;
  reset role; perform pg_temp.reg('criador comum NAO consegue criar guia', r, 'barrado');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_comum::text, true);
  select count(*) into n from visitas_diarias;
  reset role; perform pg_temp.reg('criador comum NAO le as visitas', n::text, '0');

  -- ===== admin =====
  set local role authenticated; perform set_config('request.jwt.claim.sub', v_admin::text, true);
  select count(*) into n from artigos where slug like 'teste-%-xyz';
  reset role; perform pg_temp.reg('admin le publicado e rascunho', n::text, '2');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_admin::text, true);
  begin insert into artigos (id, slug, titulo, corpo) values (gen_random_uuid(), 'teste-admin-xyz', 'Adm', 'x'); r := 'inseriu'; exception when others then r := 'barrado'; end;
  reset role; perform pg_temp.reg('admin consegue criar guia', r, 'inseriu');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_admin::text, true);
  update artigos set titulo = 'Editado' where slug = 'teste-admin-xyz'; get diagnostics n = row_count;
  reset role; perform pg_temp.reg('admin consegue editar guia (linhas alteradas)', n::text, '1');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_admin::text, true);
  begin insert into artigos (id, slug, titulo, corpo) values (gen_random_uuid(), 'Slug Ruim!', 'x', 'x'); r := 'inseriu'; exception when others then r := 'barrado'; end;
  reset role; perform pg_temp.reg('banco recusa slug com maiuscula/espaco/simbolo', r, 'barrado');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_admin::text, true);
  begin insert into artigos (id, slug, titulo, corpo) values (gen_random_uuid(), 'teste-admin-xyz', 'Repetido', 'x'); r := 'inseriu'; exception when unique_violation then r := 'barrado'; end;
  reset role; perform pg_temp.reg('banco recusa slug repetido', r, 'barrado');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_admin::text, true);
  begin insert into artigos (id, slug, titulo, corpo, especie) values (gen_random_uuid(), 'teste-esp-xyz', 'x', 'x', 'Papagaio'); r := 'inseriu'; exception when others then r := 'barrado'; end;
  reset role; perform pg_temp.reg('banco recusa especie fora da lista', r, 'barrado');

  -- ===== contador de visitas (funcao publica) =====
  execute total_de into antes using v_hoje, '/';
  set local role anon; perform registrar_visita('/'); reset role;
  execute total_de into depois using v_hoje, '/';
  perform pg_temp.reg('visita a "/" e contada (+1)', (depois - antes)::text, '1');

  execute total_de into antes using v_hoje, '/guias';
  set local role anon; perform registrar_visita('/guias'); perform registrar_visita('/guias'); perform registrar_visita('/guias'); reset role;
  execute total_de into depois using v_hoje, '/guias';
  perform pg_temp.reg('3 visitas a "/guias" somam +3', (depois - antes)::text, '3');

  execute total_de into antes using v_hoje, '/guias/teste-publicado-xyz';
  set local role anon; perform registrar_visita('/guias/teste-publicado-xyz'); reset role;
  execute total_de into depois using v_hoje, '/guias/teste-publicado-xyz';
  perform pg_temp.reg('visita a guia PUBLICADO e contada (+1)', (depois - antes)::text, '1');

  set local role anon;
  perform registrar_visita('/guias/teste-rascunho-xyz'); perform registrar_visita('/qualquer-coisa'); perform registrar_visita('/guias/' || repeat('a', 500)); perform registrar_visita(null); perform registrar_visita('');
  reset role;
  select count(*) into n from visitas_diarias where caminho in ('/guias/teste-rascunho-xyz', '/qualquer-coisa', '') or length(caminho) > 100;
  perform pg_temp.reg('rascunho, pagina inexistente, texto gigante, null e vazio sao IGNORADOS', n::text, '0');

  set local role authenticated; perform set_config('request.jwt.claim.sub', v_admin::text, true);
  select count(*) into n from visitas_diarias where caminho in ('/', '/guias', '/guias/teste-publicado-xyz');
  reset role; perform pg_temp.reg('admin le as visitas (3 paginas contadas acima)', n::text, '3');
end $$;

select n, teste, obtido, esperado, passou from resultado order by n;

rollback;
