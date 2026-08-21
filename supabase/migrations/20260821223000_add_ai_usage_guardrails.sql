create schema if not exists coverlab_private;

revoke all on schema coverlab_private from public;
grant usage on schema coverlab_private to authenticated;

create table if not exists public.ai_usage_limits (
  operation text primary key check (
    operation in (
      'concepts',
      'production-brief',
      'generation',
      'refinement',
      'enhancement'
    )
  ),
  minute_limit integer not null check (minute_limit > 0),
  hour_limit integer not null check (hour_limit > 0),
  day_limit integer not null check (day_limit > 0),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.ai_usage_limits (
  operation,
  minute_limit,
  hour_limit,
  day_limit
)
values
  ('concepts', 5, 30, 100),
  ('production-brief', 5, 30, 100),
  ('generation', 2, 6, 20),
  ('refinement', 3, 12, 40),
  ('enhancement', 1, 4, 12)
on conflict (operation) do update
set
  minute_limit = excluded.minute_limit,
  hour_limit = excluded.hour_limit,
  day_limit = excluded.day_limit,
  updated_at = now();

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (
    operation in (
      'concepts',
      'production-brief',
      'generation',
      'refinement',
      'enhancement'
    )
  ),
  status text not null default 'reserved' check (
    status in ('reserved', 'succeeded', 'failed')
  ),
  provider text not null default 'openai',
  model text not null,
  minute_limit integer not null,
  hour_limit integer not null,
  day_limit integer not null,
  provider_response_id text,
  usage jsonb,
  estimated_cost_microusd bigint check (
    estimated_cost_microusd is null or estimated_cost_microusd >= 0
  ),
  pricing_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_usage_events_user_operation_created_idx
  on public.ai_usage_events (user_id, operation, created_at desc);

alter table public.ai_usage_limits enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists ai_usage_limits_read_authenticated
  on public.ai_usage_limits;
create policy ai_usage_limits_read_authenticated
on public.ai_usage_limits
for select
to authenticated
using (true);

drop policy if exists ai_usage_events_select_own
  on public.ai_usage_events;
create policy ai_usage_events_select_own
on public.ai_usage_events
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

revoke all on table public.ai_usage_limits from anon, authenticated;
revoke all on table public.ai_usage_events from anon, authenticated;

grant select on table public.ai_usage_limits to authenticated;
grant select on table public.ai_usage_events to authenticated;

create or replace function coverlab_private.reserve_ai_usage(
  p_operation text,
  p_model text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_limits public.ai_usage_limits%rowtype;
  v_event_id uuid;

  v_minute_count bigint := 0;
  v_hour_count bigint := 0;
  v_day_count bigint := 0;

  v_minute_oldest timestamptz;
  v_hour_oldest timestamptz;
  v_day_oldest timestamptz;

  v_retry_after integer := 0;
begin
  if v_user is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required.';
  end if;

  select *
  into v_limits
  from public.ai_usage_limits
  where operation = p_operation;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Unknown AI usage operation.';
  end if;

  if not v_limits.enabled then
    return jsonb_build_object(
      'allowed', false,
      'code', 'AI_USAGE_DISABLED',
      'operation', p_operation,
      'retryAfterSeconds', 3600
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_user::text || ':' || p_operation,
      0
    )
  );

  select
    count(*) filter (
      where created_at >= v_now - interval '1 minute'
    ),
    min(created_at) filter (
      where created_at >= v_now - interval '1 minute'
    ),
    count(*) filter (
      where created_at >= v_now - interval '1 hour'
    ),
    min(created_at) filter (
      where created_at >= v_now - interval '1 hour'
    ),
    count(*) filter (
      where created_at >= v_now - interval '24 hours'
    ),
    min(created_at) filter (
      where created_at >= v_now - interval '24 hours'
    )
  into
    v_minute_count,
    v_minute_oldest,
    v_hour_count,
    v_hour_oldest,
    v_day_count,
    v_day_oldest
  from public.ai_usage_events
  where user_id = v_user
    and operation = p_operation;

  if
    v_minute_count >= v_limits.minute_limit
    and v_minute_oldest is not null
  then
    v_retry_after := greatest(
      v_retry_after,
      greatest(
        1,
        ceil(
          extract(
            epoch from (
              v_minute_oldest + interval '1 minute' - v_now
            )
          )
        )::integer
      )
    );
  end if;

  if
    v_hour_count >= v_limits.hour_limit
    and v_hour_oldest is not null
  then
    v_retry_after := greatest(
      v_retry_after,
      greatest(
        1,
        ceil(
          extract(
            epoch from (
              v_hour_oldest + interval '1 hour' - v_now
            )
          )
        )::integer
      )
    );
  end if;

  if
    v_day_count >= v_limits.day_limit
    and v_day_oldest is not null
  then
    v_retry_after := greatest(
      v_retry_after,
      greatest(
        1,
        ceil(
          extract(
            epoch from (
              v_day_oldest + interval '24 hours' - v_now
            )
          )
        )::integer
      )
    );
  end if;

  if v_retry_after > 0 then
    return jsonb_build_object(
      'allowed', false,
      'code', 'AI_USAGE_LIMIT_REACHED',
      'operation', p_operation,
      'retryAfterSeconds', v_retry_after,
      'minuteCount', v_minute_count,
      'hourCount', v_hour_count,
      'dayCount', v_day_count,
      'minuteLimit', v_limits.minute_limit,
      'hourLimit', v_limits.hour_limit,
      'dayLimit', v_limits.day_limit
    );
  end if;

  insert into public.ai_usage_events (
    user_id,
    operation,
    model,
    minute_limit,
    hour_limit,
    day_limit,
    metadata
  )
  values (
    v_user,
    p_operation,
    p_model,
    v_limits.minute_limit,
    v_limits.hour_limit,
    v_limits.day_limit,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return jsonb_build_object(
    'allowed', true,
    'eventId', v_event_id,
    'operation', p_operation,
    'minuteCount', v_minute_count + 1,
    'hourCount', v_hour_count + 1,
    'dayCount', v_day_count + 1,
    'minuteLimit', v_limits.minute_limit,
    'hourLimit', v_limits.hour_limit,
    'dayLimit', v_limits.day_limit
  );
end;
$$;

revoke all on function coverlab_private.reserve_ai_usage(text, text, jsonb)
  from public;
grant execute on function coverlab_private.reserve_ai_usage(text, text, jsonb)
  to authenticated;

create or replace function public.reserve_ai_usage(
  p_operation text,
  p_model text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog
as $$
  select coverlab_private.reserve_ai_usage(
    p_operation,
    p_model,
    p_metadata
  );
$$;

revoke all on function public.reserve_ai_usage(text, text, jsonb)
  from public;
grant execute on function public.reserve_ai_usage(text, text, jsonb)
  to authenticated;
