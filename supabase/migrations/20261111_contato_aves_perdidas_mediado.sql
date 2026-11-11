-- A listagem publica de aves perdidas nunca deve expor contato direto.
CREATE OR REPLACE FUNCTION public.listar_aves_perdidas_publicas()
RETURNS TABLE(id uuid, data jsonb, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    a.id,
    pg_catalog.jsonb_build_object(
      'nomeAve', a.data -> 'nomeAve',
      'especie', a.data -> 'especie',
      'cor', a.data -> 'cor',
      'cidade', a.data -> 'cidade',
      'uf', a.data -> 'uf',
      'dataPerda', a.data -> 'dataPerda',
      'descricao', a.data -> 'descricao',
      'foto', a.data -> 'foto',
      'autorizaContatoPublico', false
    ) AS data,
    a.created_at
  FROM public.anuncios_aves_perdidas AS a
  WHERE a.status = 'aprovado'
  ORDER BY a.created_at DESC;
$function$;

REVOKE ALL ON FUNCTION public.listar_aves_perdidas_publicas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_aves_perdidas_publicas() TO anon, authenticated;
