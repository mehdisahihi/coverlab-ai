import {
  NextResponse,
} from "next/server";
import {
  z,
} from "zod";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  fileExtension,
  isAllowedProjectAssetExtension,
  PROJECT_ASSET_MAX_BYTES,
} from "@/lib/storage/projectAssets";

const idSchema =
  z.string().uuid();

const requestSchema =
  z.object({
    fileName:
      z.string().trim().min(1).max(255),
    mimeType:
      z.string().max(255).default(""),
    sizeBytes:
      z.number().int().positive().max(
        PROJECT_ASSET_MAX_BYTES
      ),
  });

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  const {
    id,
  } =
    await context.params;

  if (!idSchema.safeParse(id).success) {
    return NextResponse.json(
      {
        error:
          "Invalid project id.",
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
    return NextResponse.json(
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
      }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "A JSON request body is required.",
      },
      {
        status: 400,
      }
    );
  }

  const parsed =
    requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid asset metadata.",
        issues:
          parsed.error.flatten(),
      },
      {
        status: 400,
      }
    );
  }

  const extension =
    fileExtension(
      parsed.data.fileName
    );

  if (
    !extension ||
    !isAllowedProjectAssetExtension(
      extension
    )
  ) {
    return NextResponse.json(
      {
        error:
          "This file type is not supported for scientific assets.",
      },
      {
        status: 400,
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
      .eq("id", id)
      .maybeSingle();

  if (projectError) {
    console.error(
      "Asset upload project lookup error:",
      projectError
    );

    return NextResponse.json(
      {
        error:
          "Could not prepare the asset upload.",
      },
      {
        status: 500,
      }
    );
  }

  if (!project) {
    return NextResponse.json(
      {
        error:
          "Project not found.",
      },
      {
        status: 404,
      }
    );
  }

  const assetId =
    crypto.randomUUID();
  const objectPath =
    `${userId}/${id}/${assetId}.${extension}`;

  return NextResponse.json({
    assetId,
    objectPath,
    extension,
    mimeType:
      parsed.data.mimeType,
    sizeBytes:
      parsed.data.sizeBytes,
    originalName:
      parsed.data.fileName,
  });
}
