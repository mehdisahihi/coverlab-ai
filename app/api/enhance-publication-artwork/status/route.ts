import {
  finishAiUsageByProviderResponse,
} from "@/lib/usage/aiUsageLedger";
import {
  GET as handleGet,
} from "./handler";

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

export async function GET(
  request: Request
) {
  const responseId =
    new URL(
      request.url
    ).searchParams.get(
      "id"
    );

  const response =
    await handleGet(
      request
    );

  if (!responseId) {
    return response;
  }

  /*
   * Provider completion and durable-storage completion
   * are separate concerns. Once OpenAI has completed the
   * background job, billable usage must be finalized as
   * succeeded even if storing the result later fails.
   */

  if (
    response.headers.get(
      "X-CoverLab-Enhancement-Status"
    ) === "completed"
  ) {
    await finishAiUsageByProviderResponse(
      responseId,
      "succeeded",
      {
        metadata: {
          httpStatus:
            response.status,
        },
      }
    );

    return response;
  }

  const payload:
    any =
    await readJsonPayload(
      response
    );

  if (
    payload?.status === "failed" ||
    payload?.status === "cancelled" ||
    payload?.status === "incomplete"
  ) {
    await finishAiUsageByProviderResponse(
      responseId,
      "failed",
      {
        metadata: {
          httpStatus:
            response.status,
          terminalStatus:
            payload.status,
          error:
            typeof payload?.error ===
              "string"
              ? payload.error
              : null,
        },
      }
    );
  }

  return response;
}
