create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled project',
  research_title text not null default '',
  research_abstract text not null default '',
  research_keywords text not null default '',
  publisher text not null default '',
  journal text not null default '',
  artwork_type text not null default '',
  current_step smallint not null default 1 check (current_step between 1 and 8),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('generation', 'refinement', 'enhancement')),
  source_version_id uuid references public.project_versions(id) on delete set null,
  image_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  publisher text not null,
  journal text not null,
  artwork_type text not null,
  policy_id text,
  policy_status text not null check (
    policy_status in ('allowed', 'conditional', 'not-allowed', 'manual-check')
  ),
  acknowledgement_text text not null,
  acknowledged_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

create index if not exists project_versions_project_created_idx
  on public.project_versions (project_id, created_at desc);

create index if not exists policy_acknowledgements_project_created_idx
  on public.policy_acknowledgements (project_id, acknowledged_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.policy_acknowledgements enable row level security;

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own
on public.projects
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own
on public.projects
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own
on public.projects
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own
on public.projects
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists project_versions_select_own on public.project_versions;
create policy project_versions_select_own
on public.project_versions
for select
to authenticated
using ((select auth.uid()) = user_id);

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
);

drop policy if exists policy_acknowledgements_select_own on public.policy_acknowledgements;
create policy policy_acknowledgements_select_own
on public.policy_acknowledgements
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists policy_acknowledgements_insert_own on public.policy_acknowledgements;
create policy policy_acknowledgements_insert_own
on public.policy_acknowledgements
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
);

revoke all on table public.projects from anon;
revoke all on table public.project_versions from anon;
revoke all on table public.policy_acknowledgements from anon;

grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert on table public.project_versions to authenticated;
grant select, insert on table public.policy_acknowledgements to authenticated;

revoke update, delete on table public.project_versions from authenticated;
revoke update, delete on table public.policy_acknowledgements from authenticated;
