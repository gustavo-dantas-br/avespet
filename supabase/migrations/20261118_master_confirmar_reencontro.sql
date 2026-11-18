-- Confirmação recebida pelo Master diretamente do tutor, com trilha interna.
alter table public.ave_perdida_reencontros
 add column if not exists origem_confirmacao text not null default 'tutor',
 add column if not exists observacao_confirmacao text,
 add column if not exists confirmado_por_master uuid references auth.users(id);
alter table public.ave_perdida_reencontros
 add constraint reencontros_origem_confirmacao_check check (origem_confirmacao in ('tutor','master'));

create or replace function public.master_confirmar_reencontro_ave_perdida(
 p_anuncio_id uuid,p_data_reencontro date,p_observacao text,p_admin_id uuid
) returns void
language plpgsql security definer set search_path=''
as $$
declare v_ad public.anuncios_aves_perdidas%rowtype;
begin
 if p_anuncio_id is null or p_admin_id is null or
    not exists (select 1 from public.master_admins where user_id=p_admin_id) then
  raise exception 'Operação administrativa não autorizada';
 end if;
 if p_data_reencontro is null or p_data_reencontro > current_date or p_data_reencontro < date '2000-01-01' then
  raise exception 'Data inválida';
 end if;
 if char_length(btrim(coalesce(p_observacao,''))) < 15 or char_length(p_observacao)>500 then
  raise exception 'Registre como e quando a confirmação foi recebida (15 a 500 caracteres)';
 end if;
 select * into v_ad from public.anuncios_aves_perdidas
 where id=p_anuncio_id and status='aprovado' and user_id is not null for update;
 if not found then raise exception 'Somente anúncios publicados com tutor vinculado podem ser confirmados'; end if;
 insert into public.ave_perdida_reencontros
  (anuncio_id,user_id,data_reencontro,relato,nota,autoriza_publicacao,
   aprovado_publicacao,origem_confirmacao,observacao_confirmacao,confirmado_por_master)
 values(p_anuncio_id,v_ad.user_id,p_data_reencontro,'',null,false,false,
   'master',btrim(p_observacao),p_admin_id)
 on conflict (anuncio_id) do nothing;
 if not found then raise exception 'Reencontro já registrado';end if;
 update public.anuncios_aves_perdidas set status='reencontrado'
 where id=p_anuncio_id and status='aprovado';
end;
$$;
revoke all on function public.master_confirmar_reencontro_ave_perdida(uuid,date,text,uuid) from public,anon,authenticated;
grant execute on function public.master_confirmar_reencontro_ave_perdida(uuid,date,text,uuid) to service_role;
