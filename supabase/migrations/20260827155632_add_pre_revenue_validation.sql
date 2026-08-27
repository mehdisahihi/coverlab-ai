create table public.self_service_validation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  service_type text not null check (service_type in ('graphical_abstract', 'journal_cover')),
  offered_price_eur integer not null check (offered_price_eur in (99, 149)),
  currency text not null default 'EUR' check (currency = 'EUR'),
  event_type text not null check (event_type in ('paywall_viewed', 'ready_to_pay')),
  created_at timestamptz not null default now(),
  unique (user_id, project_id, event_type)
);

create index self_service_validation_events_service_event_idx
  on public.self_service_validation_events (service_type, event_type, created_at desc);

alter table public.self_service_validation_events enable row level security;

revoke all on table public.self_service_validation_events from anon, authenticated;

create or replace function public.record_self_service_validation_event(
  p_project_id uuid,
  p_event_type text
)
returns public.self_service_validation_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_artwork_type text;
  v_service_type text;
  v_price_eur integer;
  v_event public.self_service_validation_events;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_event_type not in ('paywall_viewed', 'ready_to_pay') then
    raise exception 'Invalid validation event type'
      using errcode = '22023';
  end if;

  select p.artwork_type
  into v_artwork_type
  from public.projects as p
  where p.id = p_project_id
    and p.user_id = v_user_id;

  if not found then
    raise exception 'Project not found'
      using errcode = 'P0002';
  end if;

  if v_artwork_type = 'Graphical Abstract' then
    v_service_type := 'graphical_abstract';
    v_price_eur := 99;
  elsif v_artwork_type = 'Journal Cover' then
    v_service_type := 'journal_cover';
    v_price_eur := 149;
  else
    raise exception 'Project artwork type is not eligible for self-service validation'
      using errcode = '22023';
  end if;

  insert into public.self_service_validation_events (
    user_id,
    project_id,
    service_type,
    offered_price_eur,
    currency,
    event_type
  ) values (
    v_user_id,
    p_project_id,
    v_service_type,
    v_price_eur,
    'EUR',
    p_event_type
  )
  on conflict (user_id, project_id, event_type)
  do update set
    service_type = excluded.service_type,
    offered_price_eur = excluded.offered_price_eur,
    currency = excluded.currency
  returning * into v_event;

  return v_event;
end;
$$;

create or replace function public.admin_list_self_service_validation_events()
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  project_id uuid,
  research_title text,
  service_type text,
  offered_price_eur integer,
  currency text,
  event_type text,
  created_at timestamptz
)
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
    select
      e.id,
      e.user_id,
      coalesce(u.email, ''),
      e.project_id,
      p.research_title,
      e.service_type,
      e.offered_price_eur,
      e.currency,
      e.event_type,
      e.created_at
    from public.self_service_validation_events as e
    join public.projects as p
      on p.id = e.project_id
    join auth.users as u
      on u.id = e.user_id
    order by e.created_at desc;
end;
$$;

revoke all on function public.record_self_service_validation_event(uuid, text) from public, anon;
grant execute on function public.record_self_service_validation_event(uuid, text) to authenticated;

revoke all on function public.admin_list_self_service_validation_events() from public, anon;
grant execute on function public.admin_list_self_service_validation_events() to authenticated;
