/*
 * The first launch guard prototype reserved quota in proxy.ts.
 * That happened before route-level validation and publication-policy
 * enforcement, so a request that never reached OpenAI could still consume
 * quota. Reset those development reservations before switching the guard to
 * the billable route boundary.
 *
 * This migration is intentionally one-time. Fresh environments have no rows
 * to remove.
 */
delete from public.ai_usage_events
where status = 'reserved'
  and provider_response_id is null
  and completed_at is null;
