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
  cleanupStaleProjectStorageOrphans,
  STALE_STORAGE_ORPHAN_AGE_MS,
} from "@/lib/storage/orphanCleanup";

const idSchema =
  z.string().uuid();

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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
      "Storage cleanup project lookup error:",
      projectError
    );

    return NextResponse.json(
      {
        error:
          "Could not inspect project storage.",
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

  try {
    const result =
      await cleanupStaleProjectStorageOrphans({
        supabase,
        userId,
        projectId: id,
      });

    return NextResponse.json({
      ...result,
      staleAfterHours:
        STALE_STORAGE_ORPHAN_AGE_MS /
        (60 * 60 * 1000),
    });
  } catch (cleanupError) {
    console.error(
      "Stale project storage cleanup error:",
      cleanupError
    );

    return NextResponse.json(
      {
        error:
          "Could not clean stale private storage objects.",
      },
      {
        status: 500,
      }
    );
  }
}
