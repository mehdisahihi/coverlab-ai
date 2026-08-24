import "server-only";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control":
    "private, no-store, max-age=0",
  Pragma:
    "no-cache",
} as const;

const POLICY_CODES = new Set([
  "AI_POLICY_NOT_ALLOWED",
  "AI_POLICY_MANUAL_CHECK_REQUIRED",
]);

export function isOpenAiConfigured() {
  return Boolean(
    process.env.OPENAI_API_KEY
      ?.trim()
  );
}

export function aiServiceUnavailableResponse() {
  return Response.json(
    {
      error:
        "The AI service is temporarily unavailable. Please try again later.",
      code:
        "AI_SERVICE_UNAVAILABLE",
    },
    {
      status: 503,
      headers:
        PRIVATE_NO_STORE_HEADERS,
    }
  );
}

export function aiRequestOriginGuard(
  request: Request
) {
  const fetchSite =
    request.headers.get(
      "sec-fetch-site"
    );

  if (fetchSite === "cross-site") {
    return Response.json(
      {
        error:
          "Cross-origin AI requests are not allowed.",
        code:
          "AI_CROSS_ORIGIN_REJECTED",
      },
      {
        status: 403,
        headers:
          PRIVATE_NO_STORE_HEADERS,
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

  let originHost: string;

  try {
    originHost =
      new URL(origin).host;
  } catch {
    return Response.json(
      {
        error:
          "The AI request origin could not be verified.",
        code:
          "AI_ORIGIN_INVALID",
      },
      {
        status: 400,
        headers:
          PRIVATE_NO_STORE_HEADERS,
      }
    );
  }

  const allowedHosts =
    new Set<string>();

  try {
    allowedHosts.add(
      new URL(
        request.url
      ).host
    );
  } catch {
    /* request.url is framework supplied; host headers below remain available */
  }

  const forwardedHost =
    request.headers.get(
      "x-forwarded-host"
    )
      ?.split(",")[0]
      ?.trim();

  if (forwardedHost) {
    allowedHosts.add(
      forwardedHost
    );
  }

  const host =
    request.headers.get(
      "host"
    )?.trim();

  if (host) {
    allowedHosts.add(
      host
    );
  }

  if (
    allowedHosts.size === 0 ||
    !allowedHosts.has(
      originHost
    )
  ) {
    return Response.json(
      {
        error:
          "Cross-origin AI requests are not allowed.",
        code:
          "AI_CROSS_ORIGIN_REJECTED",
      },
      {
        status: 403,
        headers:
          PRIVATE_NO_STORE_HEADERS,
      }
    );
  }

  return null;
}

export function withPrivateNoStore(
  response: Response
) {
  const headers =
    new Headers(
      response.headers
    );

  for (
    const [key, value] of
    Object.entries(
      PRIVATE_NO_STORE_HEADERS
    )
  ) {
    headers.set(
      key,
      value
    );
  }

  headers.set(
    "X-Content-Type-Options",
    "nosniff"
  );

  return new Response(
    response.body,
    {
      status:
        response.status,
      statusText:
        response.statusText,
      headers,
    }
  );
}

function safeFailureForStatus(
  status: number
) {
  if (status === 429) {
    return {
      status: 429,
      code:
        "AI_PROVIDER_RATE_LIMITED",
      error:
        "The AI service is busy right now. Please try again shortly.",
    };
  }

  if (
    status === 408 ||
    status === 504
  ) {
    return {
      status: 504,
      code:
        "AI_PROVIDER_TIMEOUT",
      error:
        "The AI request timed out. Please try again.",
    };
  }

  if (
    status === 400 ||
    status === 422
  ) {
    return {
      status: 400,
      code:
        "AI_REQUEST_REJECTED",
      error:
        "The AI request could not be processed. Review the inputs and try again.",
    };
  }

  if (
    status === 401 ||
    status === 403
  ) {
    return {
      status: 503,
      code:
        "AI_SERVICE_UNAVAILABLE",
      error:
        "The AI service is temporarily unavailable. Please try again later.",
    };
  }

  if (status >= 500) {
    return {
      status: 502,
      code:
        "AI_PROVIDER_ERROR",
      error:
        "The AI provider could not complete the request. Please try again.",
    };
  }

  return {
    status,
    code:
      "AI_REQUEST_FAILED",
    error:
      "The AI request could not be completed. Please try again.",
  };
}

export function sanitizeMeteredAiResponse(
  response: Response,
  payload: unknown
) {
  if (response.ok) {
    return withPrivateNoStore(
      response
    );
  }

  const record =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
      ? payload as Record<
          string,
          unknown
        >
      : null;

  const responseCode =
    typeof record?.code ===
      "string"
      ? record.code
      : null;

  if (
    responseCode &&
    POLICY_CODES.has(
      responseCode
    )
  ) {
    return withPrivateNoStore(
      response
    );
  }

  const safe =
    safeFailureForStatus(
      response.status
    );

  return Response.json(
    {
      error:
        safe.error,
      code:
        safe.code,
    },
    {
      status:
        safe.status,
      headers:
        PRIVATE_NO_STORE_HEADERS,
    }
  );
}

export function safeAiLedgerMetadata({
  response,
  payload,
}: {
  response: Response;
  payload: unknown;
}) {
  const record =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
      ? payload as Record<
          string,
          unknown
        >
      : null;

  return {
    httpStatus:
      response.status,
    responseCode:
      typeof record?.code ===
        "string"
        ? record.code
        : null,
  };
}
