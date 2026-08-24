import {
  aiRequestOriginGuard,
  safeAiLedgerMetadata,
  sanitizeMeteredAiResponse,
  withPrivateNoStore,
} from "@/lib/openai/runtime";

import {
  reserveAiUsageForRequest,
} from "./aiUsageGuard";
import {
  attachAiUsageProviderResponse,
  finishAiUsageEvent,
} from "./aiUsageLedger";

type MeteredHandler =
  (
    request: Request
  ) => Promise<Response>;

type MeteredOptions = {
  backgroundStart?: boolean;
  metadata?: Record<string, unknown>;
};

async function readJsonPayload(
  response: Response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    return null;
  }

  try {
    return await response
      .clone()
      .json();
  } catch {
    return null;
  }
}

function attachRequestId(
  response: Response,
  requestId: string
) {
  response.headers.set(
    "X-CoverLab-Request-Id",
    requestId
  );

  return response;
}

export async function runMeteredAiPost(
  request: Request,
  handler: MeteredHandler,
  options: MeteredOptions = {}
) {
  const requestId =
    crypto.randomUUID();

  const originResponse =
    aiRequestOriginGuard(
      request
    );

  if (originResponse) {
    return attachRequestId(
      originResponse,
      requestId
    );
  }

  const reservation =
    await reserveAiUsageForRequest(
      request,
      options.metadata
    );

  if (!reservation.ok) {
    return attachRequestId(
      withPrivateNoStore(
        reservation.response
      ),
      requestId
    );
  }

  const eventId =
    reservation.eventId;

  try {
    const response =
      await handler(
        request
      );

    const payload:
      any =
      await readJsonPayload(
        response
      );

    const providerResponseId =
      typeof payload?.responseId ===
        "string"
        ? payload.responseId
        : null;

    if (
      options.backgroundStart &&
      response.ok &&
      providerResponseId
    ) {
      await attachAiUsageProviderResponse(
        eventId,
        providerResponseId,
        {
          httpStatus:
            response.status,
          requestId,
        }
      );

      return attachRequestId(
        sanitizeMeteredAiResponse(
          response,
          payload
        ),
        requestId
      );
    }

    await finishAiUsageEvent(
      eventId,
      response.ok
        ? "succeeded"
        : "failed",
      {
        providerResponseId,
        usage:
          payload?.usage ??
          null,
        metadata: {
          ...safeAiLedgerMetadata({
            response,
            payload,
          }),
          requestId,
        },
      }
    );

    return attachRequestId(
      sanitizeMeteredAiResponse(
        response,
        payload
      ),
      requestId
    );
  } catch (error) {
    const errorName =
      error instanceof Error
        ? error.name
        : "UnknownError";

    await finishAiUsageEvent(
      eventId,
      "failed",
      {
        metadata: {
          requestId,
          thrownErrorName:
            errorName,
        },
      }
    );

    console.error(
      "Metered AI route failed:",
      {
        requestId,
        errorName,
      }
    );

    return attachRequestId(
      Response.json(
        {
          error:
            "The AI request could not be completed. Please try again.",
          code:
            "AI_REQUEST_FAILED",
        },
        {
          status: 502,
          headers: {
            "Cache-Control":
              "private, no-store, max-age=0",
            Pragma:
              "no-cache",
          },
        }
      ),
      requestId
    );
  }
}
