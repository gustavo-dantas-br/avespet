-- Complementos não sensíveis da identificação da ave no anúncio público.
-- Não incluir telefone, e-mail, nome do tutor ou anilha.
create or replace function public.listar_aves_perdidas_publicas()
returns table(id uuid, data jsonb, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    a.id,
    pg_catalog.jsonb_build_object(
      'nomeAve', a.data -> 'nomeAve',
      'especie', a.data -> 'especie',
      'cor', a.data -> 'cor',
      'sexo', a.data -> 'sexo',
      'idadeAproximada', a.data -> 'idadeAproximada',
      'caracteristicas', a.data -> 'caracteristicas',
      'bairro', a.data -> 'bairro',
      'cidade', a.data -> 'cidade',
      'uf', a.data -> 'uf',
      'dataPerda', a.data -> 'dataPerda',
      'descricao', a.data -> 'descricao',
      'foto', a.data -> 'foto',
      'autorizaContatoPublico', false
    ) as data,
    a.created_at
  from public.anuncios_aves_perdidas as a
  where a.status = 'aprovado'
  order by a.created_at desc;
$function$;

revoke all on function public.listar_aves_perdidas_publicas() from public;
grant execute on function public.listar_aves_perdidas_publicas() to anon, authenticated;
