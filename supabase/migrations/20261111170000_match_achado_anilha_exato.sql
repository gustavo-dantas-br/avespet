-- Evita associar um achado de anilha ao criador errado quando há
-- correspondência parcial ou números de anilha duplicados.
-- Em caso de duplicidade, o registro é preservado para triagem manual,
-- mas não recebe owner_user_id nem ave_nome automaticamente.

CREATE OR REPLACE FUNCTION public.registrar_achado_anilha(
  p_anilha text,
  p_nome text,
  p_telefone text,
  p_mensagem text,
  p_endereco text DEFAULT ''::text,
  p_foto text DEFAULT ''::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_anilha text := pg_catalog.btrim(COALESCE(p_anilha, ''));
  v_anilha_normalizada text;
  v_nome text := pg_catalog.btrim(COALESCE(p_nome, ''));
  v_telefone text := pg_catalog.btrim(COALESCE(p_telefone, ''));
  v_mensagem text := pg_catalog.btrim(COALESCE(p_mensagem, ''));
  v_endereco text := pg_catalog.btrim(COALESCE(p_endereco, ''));
  v_foto text := COALESCE(p_foto, '');
  v_owner uuid;
  v_nome_ave text;
  v_quantidade_matches integer := 0;
BEGIN
  IF v_anilha = '' OR pg_catalog.char_length(v_anilha) > 100 THEN
    RAISE EXCEPTION 'Anilha inválida.';
  END IF;

  v_anilha_normalizada := pg_catalog.regexp_replace(
    pg_catalog.upper(v_anilha),
    '[^A-Z0-9]',
    '',
    'g'
  );

  IF v_anilha_normalizada = '' THEN
    RAISE EXCEPTION 'Anilha inválida.';
  END IF;

  IF v_nome = '' OR pg_catalog.char_length(v_nome) > 120 THEN
    RAISE EXCEPTION 'Nome inválido.';
  END IF;
  IF v_telefone = '' OR pg_catalog.char_length(v_telefone) > 30 THEN
    RAISE EXCEPTION 'Telefone inválido.';
  END IF;
  IF pg_catalog.char_length(v_mensagem) > 2000 THEN
    RAISE EXCEPTION 'Mensagem muito longa.';
  END IF;
  IF pg_catalog.char_length(v_endereco) > 500 THEN
    RAISE EXCEPTION 'Endereço muito longo.';
  END IF;
  IF pg_catalog.char_length(v_foto) > 1000000 THEN
    RAISE EXCEPTION 'Imagem muito grande.';
  END IF;

  SELECT pg_catalog.count(*)
    INTO v_quantidade_matches
  FROM public.aves AS a
  WHERE pg_catalog.regexp_replace(
    pg_catalog.upper(pg_catalog.btrim(COALESCE(a.data ->> 'anilha', ''))),
    '[^A-Z0-9]',
    '',
    'g'
  ) = v_anilha_normalizada;

  -- Só associa automaticamente quando existe exatamente uma ave.
  -- Duplicidades ficam sem proprietário associado para revisão manual.
  IF v_quantidade_matches = 1 THEN
    SELECT a.user_id, a.data ->> 'nome'
      INTO v_owner, v_nome_ave
    FROM public.aves AS a
    WHERE pg_catalog.regexp_replace(
      pg_catalog.upper(pg_catalog.btrim(COALESCE(a.data ->> 'anilha', ''))),
      '[^A-Z0-9]',
      '',
      'g'
    ) = v_anilha_normalizada
    LIMIT 1;
  END IF;

  INSERT INTO public.achados_anilha (
    anilha_buscada,
    nome_encontrador,
    telefone_encontrador,
    mensagem,
    endereco,
    foto,
    owner_user_id,
    ave_nome
  )
  VALUES (
    v_anilha,
    v_nome,
    v_telefone,
    v_mensagem,
    NULLIF(v_endereco, ''),
    NULLIF(v_foto, ''),
    v_owner,
    v_nome_ave
  );
END;
$function$;
