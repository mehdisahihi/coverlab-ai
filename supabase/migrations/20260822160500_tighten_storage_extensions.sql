drop policy if exists coverlab_storage_insert_own on storage.objects;

create policy coverlab_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  (
    bucket_id = 'project-assets'
    and lower(storage.extension(name)) in (
      'png', 'jpg', 'jpeg', 'webp', 'svg', 'tif', 'tiff',
      'pdb', 'gro', 'mol', 'mol2', 'sdf', 'pdf'
    )
  )
  or
  (
    bucket_id = 'artwork-versions'
    and lower(storage.extension(name)) in (
      'png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff', 'pdf', 'eps'
    )
  )
)
and (storage.foldername(name))[1] = (select auth.uid())::text
and exists (
  select 1
  from public.projects p
  where p.user_id = (select auth.uid())
    and p.id::text = (storage.foldername(name))[2]
);
