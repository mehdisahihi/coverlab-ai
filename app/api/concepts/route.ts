import {
  aiServiceUnavailableResponse,
  isOpenAiConfigured,
} from "@/lib/openai/runtime";
import {
  runMeteredAiPost,
} from "@/lib/usage/meteredRoute";
import {
  POST as handlePost,
} from "./handler";

export async function POST(
  request: Request
) {
  let body: any;

  try {
    body =
      await request
        .clone()
        .json();
  } catch {
    return Response.json(
      {
        error:
          "Invalid JSON request body.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !body?.title ||
    !body?.abstract
  ) {
    return Response.json(
      {
        error:
          "Title and abstract are required.",
      },
      {
        status: 400,
      }
    );
  }

  if (!isOpenAiConfigured()) {
    return aiServiceUnavailableResponse();
  }

  return runMeteredAiPost(
    request,
    handlePost,
    {
      metadata: {
        artworkType:
          body?.artworkType ??
          null,
      },
    }
  );
}
