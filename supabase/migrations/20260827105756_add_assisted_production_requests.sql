create table public.assisted_production_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  service_type text not null check (service_type in ('graphical_abstract', 'journal_cover')),
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 120),
  contact_email text not null check (char_length(btrim(contact_email)) between 3 and 320),
  institution text not null default '' check (char_length(institution) <= 200),
  paper_title text not null check (char_length(btrim(paper_title)) between 3 and 500),
  target_journal text not null default '' check (char_length(target_journal) <= 200),
  research_summary text not null check (char_length(btrim(research_summary)) between 20 and 6000),
  deadline date,
  notes text not null default '' check (char_length(notes) <= 4000),
  status text not null default 'requested' check (status in ('requested', 'reviewing', 'quoted', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assisted_production_requests_user_created_idx
  on public.assisted_production_requests (user_id, created_at desc);

create index assisted_production_requests_project_idx
  on public.assisted_production_requests (project_id)
  where project_id is not null;

create trigger set_assisted_production_requests_updated_at
before update on public.assisted_production_requests
for each row execute function public.set_updated_at();

alter table public.assisted_production_requests enable row level security;

revoke all on table public.assisted_production_requests from anon, authenticated;
grant select, insert on table public.assisted_production_requests to authenticated;

create policy assisted_production_requests_select_own
on public.assisted_production_requests
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy assisted_production_requests_insert_own
on public.assisted_production_requests
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'requested'
  and (
    project_id is null
    or exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.user_id = (select auth.uid())
    )
  )
);
