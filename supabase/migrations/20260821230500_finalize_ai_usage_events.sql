create unique index if not exists ai_usage_events_provider_response_uidx
  on public.ai_usage_events (provider_response_id)
  where provider_response_id is not null;

create or replace function coverlab_private.finish_ai_usage(
  p_event_id uuid,
  p_status text,
  p_provider_response_id text default null,
  p_usage jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required.';
  end if;

  if p_status not in ('succeeded', 'failed') then
    raise exception using
      errcode = '22023',
      message = 'AI usage event status must be succeeded or failed.';
  end if;

  update public.ai_usage_events
  set
    status = p_status,
    provider_response_id = coalesce(
      p_provider_response_id,
      provider_response_id
    ),
    usage = coalesce(p_usage, usage),
    metadata = metadata || coalesce(p_metadata, '{}'::jsonb),
    completed_at = now()
  where id = p_event_id
    and user_id = v_user
    and status = 'reserved';

  if found then
    return true;
  end if;

  return exists (
    select 1
    from public.ai_usage_events
    where id = p_event_id
      and user_id = v_user
      and status = p_status
  );
end;
$$;

revoke all on function coverlab_private.finish_ai_usage(
  uuid,
  text,
  text,
  jsonb,
  jsonb
) from public;
grant execute on function coverlab_private.finish_ai_usage(
  uuid,
  text,
  text,
  jsonb,
  jsonb
) to authenticated;

create or replace function public.finish_ai_usage(
  p_event_id uuid,
  p_status text,
  p_provider_response_id text default null,
  p_usage jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language sql
security invoker
set search_path = pg_catalog
as $$
  select coverlab_private.finish_ai_usage(
    p_event_id,
    p_status,
    p_provider_response_id,
    p_usage,
    p_metadata
  );
$$;

revoke all on function public.finish_ai_usage(
  uuid,
  text,
  text,
  jsonb,
  jsonb
) from public;
grant execute on function public.finish_ai_usage(
  uuid,
  text,
  text,
  jsonb,
  jsonb
) to authenticated;

create or replace function coverlab_private.attach_ai_usage_provider_response(
  p_event_id uuid,
  p_provider_response_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required.';
  end if;

  if p_provider_response_id is null or btrim(p_provider_response_id) = '' then
    raise exception using
      errcode = '22023',
      message = 'Provider response ID is required.';
  end if;

  update public.ai_usage_events
  set
    provider_response_id = p_provider_response_id,
    metadata = metadata || coalesce(p_metadata, '{}'::jsonb)
  where id = p_event_id
    and user_id = v_user
    and status = 'reserved';

  return found;
end;
$$;

revoke all on function coverlab_private.attach_ai_usage_provider_response(
  uuid,
  text,
  jsonb
) from public;
grant execute on function coverlab_private.attach_ai_usage_provider_response(
  uuid,
  text,
  jsonb
) to authenticated;

create or replace function public.attach_ai_usage_provider_response(
  p_event_id uuid,
  p_provider_response_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language sql
security invoker
set search_path = pg_catalog
as $$
  select coverlab_private.attach_ai_usage_provider_response(
    p_event_id,
    p_provider_response_id,
    p_metadata
  );
$$;

revoke all on function public.attach_ai_usage_provider_response(
  uuid,
  text,
  jsonb
) from public;
grant execute on function public.attach_ai_usage_provider_response(
  uuid,
  text,
  jsonb
) to authenticated;

create or replace function coverlab_private.finish_ai_usage_by_provider_response(
  p_provider_response_id text,
  p_status text,
  p_usage jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required.';
  end if;

  if p_status not in ('succeeded', 'failed') then
    raise exception using
      errcode = '22023',
      message = 'AI usage event status must be succeeded or failed.';
  end if;

  update public.ai_usage_events
  set
    status = p_status,
    usage = coalesce(p_usage, usage),
    metadata = metadata || coalesce(p_metadata, '{}'::jsonb),
    completed_at = now()
  where provider_response_id = p_provider_response_id
    and user_id = v_user
    and status = 'reserved';

  if found then
    return true;
  end if;

  return exists (
    select 1
    from public.ai_usage_events
    where provider_response_id = p_provider_response_id
      and user_id = v_user
      and status = p_status
  );
end;
$$;

revoke all on function coverlab_private.finish_ai_usage_by_provider_response(
  text,
  text,
  jsonb,
  jsonb
) from public;
grant execute on function coverlab_private.finish_ai_usage_by_provider_response(
  text,
  text,
  jsonb,
  jsonb
) to authenticated;

create or replace function public.finish_ai_usage_by_provider_response(
  p_provider_response_id text,
  p_status text,
  p_usage jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language sql
security invoker
set search_path = pg_catalog
as $$
  select coverlab_private.finish_ai_usage_by_provider_response(
    p_provider_response_id,
    p_status,
    p_usage,
    p_metadata
  );
$$;

revoke all on function public.finish_ai_usage_by_provider_response(
  text,
  text,
  jsonb,
  jsonb
) from public;
grant execute on function public.finish_ai_usage_by_provider_response(
  text,
  text,
  jsonb,
  jsonb
) to authenticated;
