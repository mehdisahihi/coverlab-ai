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
  expectedArtworkVersionPath,
} from "@/lib/storage/artworkVersions";
import {
  cleanupStaleProjectStorageOrphans,
} from "@/lib/storage/orphanCleanup";

const idSchema =
  z.string().uuid();

const requestSchema =
  z
    .object({
      operation:
        z.enum([
          "generation",
          "refinement",
          "enhancement",
        ]),
      sourceVersionId:
        z.string().uuid().nullable().optional(),
    })
    .strict();

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
          "Invalid artwork version upload request.",
        issues:
          parsed.error.flatten(),
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
      "Artwork version project lookup error:",
      projectError
    );

    return NextResponse.json(
      {
        error:
          "Could not prepare artwork version storage.",
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
        "Artwork source version lookup error:",
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

  try {
    await cleanupStaleProjectStorageOrphans({
      supabase,
      userId,
      projectId: id,
    });
  } catch (cleanupError) {
    console.warn(
      "Pre-version-upload stale storage cleanup did not complete:",
      cleanupError
    );
  }

  const versionId =
    crypto.randomUUID();
  const objectPath =
    expectedArtworkVersionPath(
      userId,
      id,
      versionId
    );

  return NextResponse.json({
    versionId,
    objectPath,
    operation:
      parsed.data.operation,
    sourceVersionId,
  });
}
