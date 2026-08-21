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

export async function runMeteredAiPost(
  request: Request,
  handler: MeteredHandler,
  options: MeteredOptions = {}
) {
  const reservation =
    await reserveAiUsageForRequest(
      request,
      options.metadata
    );

  if (!reservation.ok) {
    return reservation.response;
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
        }
      );

      return response;
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
          httpStatus:
            response.status,
          responseCode:
            typeof payload?.code ===
              "string"
              ? payload.code
              : null,
          error:
            typeof payload?.error ===
              "string"
              ? payload.error
              : null,
        },
      }
    );

    return response;
  } catch (error) {
    await finishAiUsageEvent(
      eventId,
      "failed",
      {
        metadata: {
          thrownError:
            error instanceof Error
              ? error.message
              : "Unknown route error",
        },
      }
    );

    throw error;
  }
}
