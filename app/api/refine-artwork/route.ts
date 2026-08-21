import {
  publicationPolicyPreflight,
} from "@/lib/usage/publicationPolicyPreflight";
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

  if (!body?.currentImage) {
    return Response.json(
      {
        error:
          "Current artwork is required.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !body?.artworkType ||
    !String(
      body.artworkType
    ).trim()
  ) {
    return Response.json(
      {
        error:
          "Publication artwork type is required.",
      },
      {
        status: 400,
      }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  const policyResponse =
    publicationPolicyPreflight({
      publisher:
        body?.publisher,
      journal:
        body?.journal,
      artworkType:
        body?.artworkType,
      manualPolicyConfirmed:
        body?.manualPolicyConfirmed,
      aiUseType:
        "generative-refinement",
    });

  if (policyResponse) {
    return policyResponse;
  }

  return runMeteredAiPost(
    request,
    handlePost,
    {
      metadata: {
        publisher:
          body?.publisher ??
          null,
        journal:
          body?.journal ??
          null,
        artworkType:
          body?.artworkType ??
          null,
      },
    }
  );
}
