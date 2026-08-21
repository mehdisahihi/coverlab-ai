import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";

import {
  resolveAiUsageTarget,
} from "./aiUsageRoutes";

type AiUsageReservation = {
  allowed?: boolean;
  code?: string;
  eventId?: string;
  operation?: string;
  retryAfterSeconds?: number;
  minuteCount?: number;
  hourCount?: number;
  dayCount?: number;
  minuteLimit?: number;
  hourLimit?: number;
  dayLimit?: number;
};

export type AiUsageGuardResult =
  | {
      ok: true;
      eventId: string;
    }
  | {
      ok: false;
      response: Response;
    };

export async function reserveAiUsageForRequest(
  request: Request,
  metadata: Record<string, unknown> = {}
): Promise<AiUsageGuardResult> {
  const pathname =
    new URL(
      request.url
    ).pathname;

  const target =
    resolveAiUsageTarget(
      request.method,
      pathname
    );

  if (!target) {
    return {
      ok: false,
      response:
        Response.json(
          {
            error:
              "No AI usage policy is configured for this route.",
            code:
              "AI_USAGE_ROUTE_NOT_CONFIGURED",
          },
          {
            status: 500,
          }
        ),
    };
  }

  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    return {
      ok: false,
      response:
        Response.json(
          {
            error:
              "Authentication required.",
          },
          {
            status: 401,
          }
        ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "reserve_ai_usage",
      {
        p_operation:
          target.operation,
        p_model:
          target.model,
        p_metadata: {
          path:
            pathname,
          method:
            request.method,
          guardPlacement:
            "route-before-provider",
          ...metadata,
        },
      }
    );

  if (error) {
    console.error(
      "AI usage guard error:",
      error
    );

    return {
      ok: false,
      response:
        Response.json(
          {
            error:
              "AI usage controls are temporarily unavailable. No AI request was started.",
            code:
              "AI_USAGE_GUARD_UNAVAILABLE",
          },
          {
            status: 503,
          }
        ),
    };
  }

  const reservation =
    data as
      | AiUsageReservation
      | null;

  if (
    !reservation ||
    reservation.allowed !==
      true ||
    !reservation.eventId
  ) {
    const retryAfter =
      Math.max(
        1,
        reservation
          ?.retryAfterSeconds ??
          60
      );

    const disabled =
      reservation?.code ===
      "AI_USAGE_DISABLED";

    return {
      ok: false,
      response:
        Response.json(
          {
            error:
              disabled
                ? "This AI operation is temporarily unavailable."
                : "You have reached the current CoverLab usage limit for this AI operation.",
            code:
              reservation?.code ??
              "AI_USAGE_LIMIT_REACHED",
            usage: {
              operation:
                target.operation,
              retryAfterSeconds:
                retryAfter,
              minuteCount:
                reservation
                  ?.minuteCount,
              hourCount:
                reservation
                  ?.hourCount,
              dayCount:
                reservation
                  ?.dayCount,
              minuteLimit:
                reservation
                  ?.minuteLimit,
              hourLimit:
                reservation
                  ?.hourLimit,
              dayLimit:
                reservation
                  ?.dayLimit,
            },
          },
          {
            status:
              disabled
                ? 503
                : 429,
            headers: {
              "Retry-After":
                retryAfter.toString(),
            },
          }
        ),
    };
  }

  return {
    ok: true,
    eventId:
      reservation.eventId,
  };
}
