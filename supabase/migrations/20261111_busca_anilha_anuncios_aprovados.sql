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
