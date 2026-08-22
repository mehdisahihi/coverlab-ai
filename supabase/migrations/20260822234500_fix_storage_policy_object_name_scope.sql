-- Fix name resolution inside Storage RLS policies.
--
-- Within the EXISTS subquery, an unqualified `name` resolves to
-- public.projects.name rather than storage.objects.name. Always qualify the
-- target Storage object path explicitly so project ownership is checked
-- against <user_id>/<project_id>/... as intended.

drop policy if exists coverlab_storage_select_own on storage.objects;
create policy coverlab_storage_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id in ('project-assets', 'artwork-versions')
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects p
    where p.user_id = (select auth.uid())
      and p.id::text = (storage.foldername(storage.objects.name))[2]
  )
);

drop policy if exists coverlab_storage_insert_own on storage.objects;
create policy coverlab_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  (
    (
      bucket_id = 'project-assets'
      and lower(storage.extension(storage.objects.name)) in (
        'png', 'jpg', 'jpeg', 'webp', 'svg', 'tif', 'tiff',
        'pdb', 'gro', 'mol', 'mol2', 'sdf', 'pdf'
      )
    )
    or
    (
      bucket_id = 'artwork-versions'
      and lower(storage.extension(storage.objects.name)) in (
        'png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff', 'pdf', 'eps'
      )
    )
  )
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects p
    where p.user_id = (select auth.uid())
      and p.id::text = (storage.foldername(storage.objects.name))[2]
  )
);

drop policy if exists coverlab_storage_delete_own on storage.objects;
create policy coverlab_storage_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('project-assets', 'artwork-versions')
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects p
    where p.user_id = (select auth.uid())
      and p.id::text = (storage.foldername(storage.objects.name))[2]
  )
);
