import "server-only";

import OpenAI from "openai";

export const OPENAI_TEXT_TIMEOUT_MS =
  120_000;
export const OPENAI_IMAGE_TIMEOUT_MS =
  300_000;
export const OPENAI_BACKGROUND_START_TIMEOUT_MS =
  60_000;
export const OPENAI_STATUS_TIMEOUT_MS =
  30_000;

let client: OpenAI | null =
  null;

function requiredApiKey() {
  const apiKey =
    process.env.OPENAI_API_KEY
      ?.trim();

  if (!apiKey) {
    const error =
      new Error(
        "AI service configuration is unavailable."
      );

    error.name =
      "OpenAIConfigurationError";

    throw error;
  }

  return apiKey;
}

function optionalEnv(
  name:
    | "OPENAI_ORG_ID"
    | "OPENAI_PROJECT_ID"
) {
  const value =
    process.env[name]?.trim();

  return value || undefined;
}

export function getOpenAiClient() {
  if (!client) {
    client =
      new OpenAI({
        apiKey:
          requiredApiKey(),
        organization:
          optionalEnv(
            "OPENAI_ORG_ID"
          ),
        project:
          optionalEnv(
            "OPENAI_PROJECT_ID"
          ),
        timeout:
          OPENAI_TEXT_TIMEOUT_MS,
        maxRetries: 1,
        logLevel: "warn",
      });
  }

  return client;
}

export function createOpenAiClientRequestId() {
  return crypto.randomUUID();
}

export function openAiTextRequestOptions(
  clientRequestId: string
) {
  return {
    timeout:
      OPENAI_TEXT_TIMEOUT_MS,
    maxRetries: 1,
    headers: {
      "X-Client-Request-Id":
        clientRequestId,
    },
  };
}

export function openAiImageRequestOptions(
  clientRequestId: string
) {
  return {
    timeout:
      OPENAI_IMAGE_TIMEOUT_MS,
    maxRetries: 0,
    headers: {
      "X-Client-Request-Id":
        clientRequestId,
    },
  };
}

export async function openAiFetch(
  path: string,
  init: RequestInit,
  {
    clientRequestId,
    timeoutMs,
  }: {
    clientRequestId: string;
    timeoutMs: number;
  }
) {
  if (
    !path.startsWith("/")
  ) {
    throw new Error(
      "OpenAI request path must be relative."
    );
  }

  const headers =
    new Headers(
      init.headers
    );

  headers.set(
    "Authorization",
    `Bearer ${requiredApiKey()}`
  );
  headers.set(
    "X-Client-Request-Id",
    clientRequestId
  );

  const organization =
    optionalEnv(
      "OPENAI_ORG_ID"
    );
  const project =
    optionalEnv(
      "OPENAI_PROJECT_ID"
    );

  if (organization) {
    headers.set(
      "OpenAI-Organization",
      organization
    );
  }

  if (project) {
    headers.set(
      "OpenAI-Project",
      project
    );
  }

  return fetch(
    `https://api.openai.com/v1${path}`,
    {
      ...init,
      headers,
      cache: "no-store",
      signal:
        AbortSignal.timeout(
          timeoutMs
        ),
    }
  );
}

function providerRequestIdFromError(
  error: unknown
) {
  if (
    error instanceof
      OpenAI.APIError
  ) {
    return (
      error.requestID ??
      null
    );
  }

  return null;
}

export function logOpenAiSdkError(
  context: string,
  error: unknown,
  clientRequestId: string
) {
  console.error(
    context,
    {
      clientRequestId,
      errorName:
        error instanceof Error
          ? error.name
          : "UnknownError",
      status:
        error instanceof
          OpenAI.APIError
          ? error.status
          : null,
      providerRequestId:
        providerRequestIdFromError(
          error
        ),
    }
  );
}

export function logOpenAiHttpFailure(
  context: string,
  response: Response,
  clientRequestId: string
) {
  console.error(
    context,
    {
      clientRequestId,
      status:
        response.status,
      providerRequestId:
        response.headers.get(
          "x-request-id"
        ),
    }
  );
}
