drop policy if exists project_versions_insert_own on public.project_versions;

create policy project_versions_insert_own
on public.project_versions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
  and (
    image_path is null
    or (
      split_part(image_path, '/', 1) = (select auth.uid())::text
      and split_part(image_path, '/', 2) = project_id::text
      and lower(right(image_path, 4)) = '.png'
    )
  )
);
