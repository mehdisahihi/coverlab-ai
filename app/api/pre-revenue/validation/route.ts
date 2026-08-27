import {
  z,
} from "zod/v3";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";

const validationEventSchema =
  z.object({
    projectId:
      z.string().uuid(),
    eventType:
      z.enum([
        "paywall_viewed",
        "ready_to_pay",
      ]),
  });

const PRIVATE_HEADERS = {
  "Cache-Control":
    "private, no-store, max-age=0",
  Pragma:
    "no-cache",
} as const;

function originGuard(
  request: Request
) {
  const fetchSite =
    request.headers.get(
      "sec-fetch-site"
    );

  if (
    fetchSite ===
    "cross-site"
  ) {
    return Response.json(
      {
        error:
          "Cross-origin validation requests are not allowed.",
        code:
          "VALIDATION_CROSS_ORIGIN_REJECTED",
      },
      {
        status: 403,
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return null;
  }

  try {
    const originUrl =
      new URL(origin);
    const requestUrl =
      new URL(
        request.url
      );

    if (
      originUrl.host !==
      requestUrl.host
    ) {
      return Response.json(
        {
          error:
            "Cross-origin validation requests are not allowed.",
          code:
            "VALIDATION_CROSS_ORIGIN_REJECTED",
        },
        {
          status: 403,
          headers:
            PRIVATE_HEADERS,
        }
      );
    }
  } catch {
    return Response.json(
      {
        error:
          "The request origin could not be verified.",
        code:
          "VALIDATION_ORIGIN_INVALID",
      },
      {
        status: 400,
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  return null;
}

export async function POST(
  request: Request
) {
  const originResponse =
    originGuard(
      request
    );

  if (originResponse) {
    return originResponse;
  }

  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    return Response.json(
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return Response.json(
      {
        error:
          "Invalid JSON request body.",
      },
      {
        status: 400,
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  const parsed =
    validationEventSchema.safeParse(
      body
    );

  if (!parsed.success) {
    return Response.json(
      {
        error:
          "Invalid validation event.",
      },
      {
        status: 400,
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  const {
    data: isInternalAdmin,
    error: adminError,
  } =
    await supabase.rpc(
      "is_coverlab_assisted_admin"
    );

  if (adminError) {
    console.error(
      "Validation admin access check failed:",
      {
        code:
          adminError.code,
        message:
          adminError.message,
      }
    );

    return Response.json(
      {
        error:
          "Validation access could not be verified.",
        code:
          "VALIDATION_ACCESS_UNAVAILABLE",
      },
      {
        status: 503,
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  if (
    isInternalAdmin === true
  ) {
    return Response.json(
      {
        recorded:
          false,
        internalAdmin:
          true,
      },
      {
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  const {
    projectId,
    eventType,
  } =
    parsed.data;

  if (
    eventType ===
    "ready_to_pay"
  ) {
    const {
      error:
        viewedError,
    } =
      await supabase.rpc(
        "record_self_service_validation_event",
        {
          p_project_id:
            projectId,
          p_event_type:
            "paywall_viewed",
        }
      );

    if (viewedError) {
      console.error(
        "Validation paywall-view backfill failed:",
        {
          code:
            viewedError.code,
          message:
            viewedError.message,
        }
      );

      return Response.json(
        {
          error:
            "Your early-access interest could not be saved.",
          code:
            "VALIDATION_EVENT_FAILED",
        },
        {
          status: 500,
          headers:
            PRIVATE_HEADERS,
        }
      );
    }
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "record_self_service_validation_event",
      {
        p_project_id:
          projectId,
        p_event_type:
          eventType,
      }
    );

  if (error) {
    console.error(
      "Validation event recording failed:",
      {
        code:
          error.code,
        message:
          error.message,
      }
    );

    return Response.json(
      {
        error:
          "Your early-access interest could not be saved.",
        code:
          "VALIDATION_EVENT_FAILED",
      },
      {
        status:
          error.code ===
          "P0002"
            ? 404
            : 500,
        headers:
          PRIVATE_HEADERS,
      }
    );
  }

  return Response.json(
    {
      recorded:
        true,
      event:
        data,
    },
    {
      headers:
        PRIVATE_HEADERS,
    }
  );
}
