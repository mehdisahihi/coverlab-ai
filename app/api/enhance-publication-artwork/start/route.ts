import {
  z,
} from "zod";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  publicationPolicyPreflight,
} from "@/lib/usage/publicationPolicyPreflight";
import {
  runMeteredAiPost,
} from "@/lib/usage/meteredRoute";
import {
  POST as handlePost,
} from "./handler";

const uuidSchema =
  z.string().uuid();

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

  if (!body?.croppedImage) {
    return Response.json(
      {
        error:
          "Approved cropped artwork is required.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isFinite(
      body?.targetWidth
    ) ||
    !Number.isFinite(
      body?.targetHeight
    ) ||
    body.targetWidth <= 0 ||
    body.targetHeight <= 0
  ) {
    return Response.json(
      {
        error:
          "Valid target publication dimensions are required.",
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

  if (
    !uuidSchema.safeParse(
      body?.projectId
    ).success
  ) {
    return Response.json(
      {
        error:
          "A valid project ID is required for enhancement.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !uuidSchema.safeParse(
      body?.sourceVersionId
    ).success
  ) {
    return Response.json(
      {
        error:
          "A valid source artwork version is required for enhancement.",
      },
      {
        status: 400,
      }
    );
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
      }
    );
  }

  const {
    data: project,
    error: projectError,
  } =
    await supabase
      .from("projects")
      .select("id")
      .eq(
        "id",
        body.projectId
      )
      .maybeSingle();

  if (projectError) {
    console.error(
      "Enhancement project validation error:",
      projectError
    );

    return Response.json(
      {
        error:
          "Could not validate the enhancement project.",
      },
      {
        status: 500,
      }
    );
  }

  if (!project) {
    return Response.json(
      {
        error:
          "Project not found.",
      },
      {
        status: 404,
      }
    );
  }

  const {
    data: sourceVersion,
    error: sourceError,
  } =
    await supabase
      .from("project_versions")
      .select("id")
      .eq(
        "id",
        body.sourceVersionId
      )
      .eq(
        "project_id",
        body.projectId
      )
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();

  if (sourceError) {
    console.error(
      "Enhancement source version validation error:",
      sourceError
    );

    return Response.json(
      {
        error:
          "Could not validate the source artwork version.",
      },
      {
        status: 500,
      }
    );
  }

  if (!sourceVersion) {
    return Response.json(
      {
        error:
          "Source artwork version not found.",
      },
      {
        status: 400,
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
        "detail-enhancement",
    });

  if (policyResponse) {
    return policyResponse;
  }

  return runMeteredAiPost(
    request,
    handlePost,
    {
      backgroundStart:
        true,
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
        targetWidth:
          body?.targetWidth ??
          null,
        targetHeight:
          body?.targetHeight ??
          null,
        projectId:
          body.projectId,
        sourceVersionId:
          body.sourceVersionId,
      },
    }
  );
}
