-- A funcao de trigger e chamada pelo proprio Postgres.
-- Nao deve ser invocavel diretamente pela API publica.
REVOKE ALL ON FUNCTION public.vincular_achados_anilha_ao_anuncio_aprovado()
  FROM PUBLIC, anon, authenticated;
