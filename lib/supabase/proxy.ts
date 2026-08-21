import {
  createServerClient,
} from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  resolveAiUsageTarget,
} from "@/lib/usage/aiUsageRoutes";
import {
  getSupabasePublicConfig,
} from "./config";

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

function isProtectedBrowserPath(
  pathname: string
) {
  return (
    pathname === "/create" ||
    pathname.startsWith(
      "/create/"
    ) ||
    pathname === "/projects" ||
    pathname.startsWith(
      "/projects/"
    )
  );
}

function isProtectedApiPath(
  pathname: string
) {
  return (
    pathname === "/api/projects" ||
    pathname.startsWith(
      "/api/projects/"
    ) ||
    pathname === "/api/concepts" ||
    pathname ===
      "/api/production-brief" ||
    pathname ===
      "/api/generate-artwork" ||
    pathname ===
      "/api/refine-artwork" ||
    pathname ===
      "/api/enhance-publication-artwork" ||
    pathname.startsWith(
      "/api/enhance-publication-artwork/"
    )
  );
}

function copySessionCookies(
  source: NextResponse,
  target: NextResponse
) {
  source.cookies
    .getAll()
    .forEach(
      (cookie) => {
        target.cookies.set(
          cookie
        );
      }
    );

  return target;
}

function jsonResponse(
  sessionResponse: NextResponse,
  body: Record<string, unknown>,
  init: {
    status: number;
    headers?: Record<string, string>;
  }
) {
  return copySessionCookies(
    sessionResponse,
    NextResponse.json(
      body,
      init
    )
  );
}

export async function updateSession(
  request: NextRequest
) {
  let response =
    NextResponse.next({
      request,
    });

  const {
    url,
    publishableKey,
  } = getSupabasePublicConfig();

  const supabase =
    createServerClient(
      url,
      publishableKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) =>
                request.cookies.set(
                  name,
                  value
                )
            );

            response =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) =>
                response.cookies.set(
                  name,
                  value,
                  options
                )
            );
          },
        },
      }
    );

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims();

  const userId =
    typeof data?.claims?.sub ===
    "string"
      ? data.claims.sub
      : null;

  const pathname =
    request.nextUrl.pathname;
  const unauthenticated =
    Boolean(
      error ||
      !userId
    );

  if (
    isProtectedApiPath(
      pathname
    ) &&
    unauthenticated
  ) {
    return jsonResponse(
      response,
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
      }
    );
  }

  if (
    isProtectedBrowserPath(
      pathname
    ) &&
    unauthenticated
  ) {
    const redirectUrl =
      request.nextUrl.clone();

    redirectUrl.pathname =
      "/auth/login";

    redirectUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return copySessionCookies(
      response,
      NextResponse.redirect(
        redirectUrl
      )
    );
  }

  /*
   * The active publication-quality UI uses the
   * background /start + /status flow. Keep the old
   * synchronous endpoint in the repository for now,
   * but do not allow it to bypass the current
   * publication AI-policy enforcement path.
   */
  if (
    request.method === "POST" &&
    pathname ===
      "/api/enhance-publication-artwork"
  ) {
    return jsonResponse(
      response,
      {
        error:
          "This legacy enhancement endpoint is disabled. Use the publication enhancement start endpoint.",
        code:
          "LEGACY_ENHANCEMENT_ENDPOINT_DISABLED",
      },
      {
        status: 410,
      }
    );
  }

  const usageTarget =
    resolveAiUsageTarget(
      request.method,
      pathname
    );

  if (
    usageTarget &&
    userId
  ) {
    const {
      data: reservationData,
      error: reservationError,
    } =
      await supabase.rpc(
        "reserve_ai_usage",
        {
          p_operation:
            usageTarget.operation,
          p_model:
            usageTarget.model,
          p_metadata: {
            path:
              pathname,
            method:
              request.method,
          },
        }
      );

    if (reservationError) {
      console.error(
        "AI usage guard error:",
        reservationError
      );

      return jsonResponse(
        response,
        {
          error:
            "AI usage controls are temporarily unavailable. No AI request was started.",
          code:
            "AI_USAGE_GUARD_UNAVAILABLE",
        },
        {
          status: 503,
        }
      );
    }

    const reservation =
      reservationData as
        | AiUsageReservation
        | null;

    if (
      !reservation ||
      reservation.allowed !==
        true
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

      return jsonResponse(
        response,
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
              usageTarget.operation,
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
      );
    }

    response.headers.set(
      "X-CoverLab-Usage-Event",
      reservation.eventId ??
        "reserved"
    );
  }

  return response;
}
