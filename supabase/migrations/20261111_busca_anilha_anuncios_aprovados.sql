-- A busca publica informa apenas se existe uma ave cadastrada como perdida.
-- A identificacao do titular e feita exclusivamente pela equipe administrativa.
CREATE OR REPLACE FUNCTION public.buscar_perdida_por_anilha(p_anilha text)
RETURNS TABLE (
  id uuid,
  status text,
  nome_ave text,
  especie text,
  cor_mutacao text,
  anilha text,
  foto text,
  nome_criatorio text,
  whatsapp text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    p.id,
    p.status,
    p.data ->> 'nomeAve',
    p.data ->> 'especie',
    p.data ->> 'corMutacao',
    p.data ->> 'anilha',
    p.data ->> 'foto',
    NULL::text,
    NULL::text
  FROM public.perdidas AS p
  WHERE p.status = 'perdida'
    AND p_anilha IS NOT NULL
    AND pg_catalog.btrim(p_anilha) <> ''
    AND pg_catalog.regexp_replace(pg_catalog.upper(COALESCE(p.data ->> 'anilha', '')), '[^A-Z0-9]', '', 'g')
      = pg_catalog.regexp_replace(pg_catalog.upper(pg_catalog.btrim(p_anilha)), '[^A-Z0-9]', '', 'g');
$function$;

REVOKE ALL ON FUNCTION public.buscar_perdida_por_anilha(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_perdida_por_anilha(text) TO anon, authenticated;

-- Busca anuncios novos de aves perdidas aprovados pelo numero da anilha.
-- A resposta publica nao inclui dados de contato sem autorizacao expressa.
CREATE OR REPLACE FUNCTION public.buscar_anuncio_perdido_por_anilha(p_anilha text)
RETURNS TABLE (
  id uuid,
  status text,
  nome_ave text,
  especie text,
  cor_mutacao text,
  anilha text,
  foto text,
  nome_criatorio text,
  whatsapp text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    a.id,
    'perdida'::text,
    a.data ->> 'nomeAve',
    a.data ->> 'especie',
    a.data ->> 'cor',
    a.data ->> 'anilha',
    a.data ->> 'foto',
    CASE WHEN a.data -> 'autorizaContatoPublico' = 'true'::jsonb
      THEN a.data ->> 'contatoNome' ELSE NULL END,
    CASE WHEN a.data -> 'autorizaContatoPublico' = 'true'::jsonb
      THEN a.data ->> 'whatsapp' ELSE NULL END
  FROM public.anuncios_aves_perdidas AS a
  WHERE a.status = 'aprovado'
    AND p_anilha IS NOT NULL
    AND pg_catalog.btrim(p_anilha) <> ''
    AND pg_catalog.regexp_replace(pg_catalog.upper(COALESCE(a.data ->> 'anilha', '')), '[^A-Z0-9]', '', 'g')
      = pg_catalog.regexp_replace(pg_catalog.upper(pg_catalog.btrim(p_anilha)), '[^A-Z0-9]', '', 'g');
$function$;

REVOKE ALL ON FUNCTION public.buscar_anuncio_perdido_por_anilha(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_anuncio_perdido_por_anilha(text) TO anon, authenticated;


-- Quando o titular cadastrar e tiver o anuncio aprovado depois do achado,
-- vincula o registro pendente ao usuario para a equipe administrativa intermediar.
CREATE OR REPLACE FUNCTION public.vincular_achados_anilha_ao_anuncio_aprovado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_anilha text;
BEGIN
  IF NEW.status <> 'aprovado' THEN
    RETURN NEW;
  END IF;

  v_anilha := pg_catalog.regexp_replace(
    pg_catalog.upper(pg_catalog.coalesce(NEW.data ->> 'anilha', '')),
    '[^A-Z0-9]', '', 'g'
  );

  IF v_anilha = '' THEN
    RETURN NEW;
  END IF;

  UPDATE public.achados_anilha AS achado
  SET owner_user_id = NEW.user_id,
      ave_nome = COALESCE(NULLIF(NEW.data ->> 'nomeAve', ''), NEW.data ->> 'especie')
  WHERE achado.owner_user_id IS NULL
    AND pg_catalog.regexp_replace(
      pg_catalog.upper(COALESCE(achado.anilha_buscada, '')),
      '[^A-Z0-9]', '', 'g'
    ) = v_anilha;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_vincular_achados_anilha_anuncio_aprovado
  ON public.anuncios_aves_perdidas;

CREATE TRIGGER trg_vincular_achados_anilha_anuncio_aprovado
AFTER INSERT OR UPDATE OF status, data
ON public.anuncios_aves_perdidas
FOR EACH ROW
EXECUTE FUNCTION public.vincular_achados_anilha_ao_anuncio_aprovado();

REVOKE ALL ON FUNCTION public.vincular_achados_anilha_ao_anuncio_aprovado() FROM PUBLIC;
