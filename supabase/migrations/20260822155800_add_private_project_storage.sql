-- Private, owner-scoped storage for scientific source assets and artwork versions.
-- Object paths are always:
--   <user_id>/<project_id>/...
-- This lets Storage RLS verify both the authenticated owner and project ownership.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'project-assets',
    'project-assets',
    false,
    26214400,
    null
  ),
  (
    'artwork-versions',
    'artwork-versions',
    false,
    52428800,
    null
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null default 'project-assets' check (bucket_id = 'project-assets'),
  object_path text not null,
  original_name text not null,
  mime_type text not null default '',
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create index if not exists project_assets_project_created_idx
  on public.project_assets (project_id, created_at asc);

create index if not exists project_assets_user_idx
  on public.project_assets (user_id);

alter table public.project_assets enable row level security;

drop policy if exists project_assets_select_own on public.project_assets;
create policy project_assets_select_own
on public.project_assets
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists project_assets_insert_own on public.project_assets;
create policy project_assets_insert_own
on public.project_assets
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and bucket_id = 'project-assets'
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists project_assets_delete_own on public.project_assets;
create policy project_assets_delete_own
on public.project_assets
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

revoke all on table public.project_assets from anon;
revoke all on table public.project_assets from authenticated;
grant select, insert, delete on table public.project_assets to authenticated;

-- Storage objects are immutable by path at launch: INSERT new objects and DELETE old
-- objects rather than UPDATE/upsert. This avoids stale CDN/object-version behavior.

drop policy if exists coverlab_storage_select_own on storage.objects;
create policy coverlab_storage_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id in ('project-assets', 'artwork-versions')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects p
    where p.user_id = (select auth.uid())
      and p.id::text = (storage.foldername(name))[2]
  )
);

drop policy if exists coverlab_storage_insert_own on storage.objects;
create policy coverlab_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('project-assets', 'artwork-versions')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects p
    where p.user_id = (select auth.uid())
      and p.id::text = (storage.foldername(name))[2]
  )
);

drop policy if exists coverlab_storage_delete_own on storage.objects;
create policy coverlab_storage_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('project-assets', 'artwork-versions')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects p
    where p.user_id = (select auth.uid())
      and p.id::text = (storage.foldername(name))[2]
  )
);
