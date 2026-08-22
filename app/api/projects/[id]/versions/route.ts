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
  ARTWORK_VERSION_BUCKET,
  expectedArtworkVersionPath,
} from "@/lib/storage/artworkVersions";

const idSchema =
  z.string().uuid();

const versionSchema =
  z
    .object({
      versionId:
        z.string().uuid(),
      operation:
        z.enum([
          "generation",
          "refinement",
          "enhancement",
        ]),
      sourceVersionId:
        z.string().uuid().nullable().optional(),
      imagePath:
        z.string().trim().min(1).max(2000),
      metadata:
        z.record(z.unknown()).optional(),
    })
    .strict();

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
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

  const {
    data,
    error,
  } =
    await supabase
      .from("project_versions")
      .select(
        "id,project_id,operation,source_version_id,image_path,metadata,created_at"
      )
      .eq("project_id", id)
      .not("image_path", "is", null)
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Project version list error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not load artwork version history.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    versions:
      data ?? [],
  });
}

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
    versionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid artwork version data.",
        issues:
          parsed.error.flatten(),
      },
      {
        status: 400,
      }
    );
  }

  const expectedPath =
    expectedArtworkVersionPath(
      userId,
      id,
      parsed.data.versionId
    );

  if (
    parsed.data.imagePath !==
    expectedPath
  ) {
    return NextResponse.json(
      {
        error:
          "Artwork version storage path is invalid.",
      },
      {
        status: 400,
      }
    );
  }

  const sourceVersionId =
    parsed.data.sourceVersionId ??
    null;

  if (sourceVersionId) {
    const {
      data: sourceVersion,
      error: sourceError,
    } =
      await supabase
        .from("project_versions")
        .select("id")
        .eq("id", sourceVersionId)
        .eq("project_id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (sourceError) {
      console.error(
        "Artwork source version confirmation error:",
        sourceError
      );

      return NextResponse.json(
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
      return NextResponse.json(
        {
          error:
            "Source artwork version not found.",
        },
        {
          status: 400,
        }
      );
    }
  }

  const {
    data: existing,
    error: existingError,
  } =
    await supabase
      .from("project_versions")
      .select("*")
      .eq("id", parsed.data.versionId)
      .eq("project_id", id)
      .maybeSingle();

  if (existingError) {
    console.error(
      "Artwork version idempotency lookup error:",
      existingError
    );

    return NextResponse.json(
      {
        error:
          "Could not confirm artwork version storage.",
      },
      {
        status: 500,
      }
    );
  }

  if (existing) {
    const sameVersion =
      existing.image_path ===
        parsed.data.imagePath &&
      existing.operation ===
        parsed.data.operation &&
      existing.source_version_id ===
        sourceVersionId;

    if (!sameVersion) {
      return NextResponse.json(
        {
          error:
            "Artwork version id is already in use.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      version: existing,
    });
  }

  const folder =
    `${userId}/${id}`;
  const fileName =
    `${parsed.data.versionId}.png`;

  const {
    data: storedObjects,
    error: storageError,
  } =
    await supabase.storage
      .from(ARTWORK_VERSION_BUCKET)
      .list(folder, {
        limit: 10,
        search: fileName,
      });

  if (storageError) {
    console.error(
      "Artwork version storage verification error:",
      storageError
    );

    return NextResponse.json(
      {
        error:
          "Could not verify the stored artwork version.",
      },
      {
        status: 500,
      }
    );
  }

  if (
    !storedObjects?.some(
      (item) =>
        item.name === fileName
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Stored artwork image was not found.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("project_versions")
      .insert({
        id:
          parsed.data.versionId,
        project_id:
          id,
        user_id:
          userId,
        operation:
          parsed.data.operation,
        source_version_id:
          sourceVersionId,
        image_path:
          parsed.data.imagePath,
        metadata:
          parsed.data.metadata ?? {},
      })
      .select("*")
      .single();

  if (error) {
    console.error(
      "Project version create error:",
      error
    );

    const status =
      error.code === "42501"
        ? 403
        : 500;

    return NextResponse.json(
      {
        error:
          status === 403
            ? "Project access denied."
            : "Could not save artwork version.",
      },
      {
        status,
      }
    );
  }

  return NextResponse.json(
    {
      version: data,
    },
    {
      status: 201,
    }
  );
}
