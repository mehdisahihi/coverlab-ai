import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";

export type AiUsageFinalStatus =
  | "succeeded"
  | "failed";

type FinishOptions = {
  providerResponseId?: string | null;
  usage?: unknown;
  metadata?: Record<string, unknown>;
};

function normalizeJsonValue(
  value: unknown
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(value)
    );
  } catch {
    return null;
  }
}

export async function finishAiUsageEvent(
  eventId: string,
  status: AiUsageFinalStatus,
  options: FinishOptions = {}
) {
  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    return false;
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "finish_ai_usage",
      {
        p_event_id:
          eventId,
        p_status:
          status,
        p_provider_response_id:
          options.providerResponseId ??
          null,
        p_usage:
          normalizeJsonValue(
            options.usage
          ),
        p_metadata:
          options.metadata ?? {},
      }
    );

  if (error) {
    console.error(
      "Could not finalize AI usage event:",
      error
    );

    return false;
  }

  return data === true;
}

export async function attachAiUsageProviderResponse(
  eventId: string,
  providerResponseId: string,
  metadata: Record<string, unknown> = {}
) {
  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    return false;
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "attach_ai_usage_provider_response",
      {
        p_event_id:
          eventId,
        p_provider_response_id:
          providerResponseId,
        p_metadata:
          metadata,
      }
    );

  if (error) {
    console.error(
      "Could not attach provider response to AI usage event:",
      error
    );

    return false;
  }

  return data === true;
}

export async function finishAiUsageByProviderResponse(
  providerResponseId: string,
  status: AiUsageFinalStatus,
  options: Omit<FinishOptions, "providerResponseId"> = {}
) {
  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    return false;
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "finish_ai_usage_by_provider_response",
      {
        p_provider_response_id:
          providerResponseId,
        p_status:
          status,
        p_usage:
          normalizeJsonValue(
            options.usage
          ),
        p_metadata:
          options.metadata ?? {},
      }
    );

  if (error) {
    console.error(
      "Could not finalize background AI usage event:",
      error
    );

    return false;
  }

  return data === true;
}
