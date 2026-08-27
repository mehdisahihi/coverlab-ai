alter table public.assisted_production_requests
  drop constraint if exists assisted_production_requests_status_check;

alter table public.assisted_production_requests
  add constraint assisted_production_requests_status_check
  check (
    status in (
      'requested',
      'reviewing',
      'quoted',
      'accepted',
      'in_production',
      'declined',
      'completed',
      'cancelled'
    )
  );

create or replace function public.is_coverlab_assisted_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from auth.users as u
    where u.id = auth.uid()
      and lower(coalesce(u.email, '')) = 'coverlab.ai.journals@gmail.com'
  );
$$;

create or replace function public.admin_list_assisted_production_requests()
returns setof public.assisted_production_requests
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_coverlab_assisted_admin() then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  return query
    select r.*
    from public.assisted_production_requests as r
    order by r.created_at desc;
end;
$$;

create or replace function public.admin_update_assisted_production_request_status(
  p_request_id uuid,
  p_status text
)
returns public.assisted_production_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_request public.assisted_production_requests;
begin
  if not public.is_coverlab_assisted_admin() then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  if p_status not in (
    'requested',
    'reviewing',
    'quoted',
    'accepted',
    'in_production',
    'declined',
    'completed',
    'cancelled'
  ) then
    raise exception 'Invalid assisted production status'
      using errcode = '22023';
  end if;

  update public.assisted_production_requests
  set status = p_status
  where id = p_request_id
  returning * into updated_request;

  if updated_request.id is null then
    raise exception 'Assisted production request not found'
      using errcode = 'P0002';
  end if;

  return updated_request;
end;
$$;
