-- Avespet: armazenamento público de fotos comprimidas de aves.
-- Execute no SQL Editor do Supabase uma única vez.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-publicas-aves',
  'fotos-publicas-aves',
  true,
  163840,
  array['image/jpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "publico envia fotos comprimidas de aves" on storage.objects;
create policy "publico envia fotos comprimidas de aves"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'fotos-publicas-aves'
  and name ~ '^(perdidas|achados)/[0-9a-f-]{36}\.jpg$'
  and lower(coalesce(metadata->>'mimetype', 'image/jpeg')) = 'image/jpeg'
);

-- O bucket é público para leitura das fotos por URL; não concedemos listagem,
-- atualização ou exclusão pública dos arquivos.
