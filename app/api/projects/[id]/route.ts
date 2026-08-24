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
  projectMutationSchema,
  toProjectRow,
} from "@/lib/projects/input";
import {
  deleteProjectStorage,
} from "@/lib/storage/projectCleanup";

const idSchema =
  z.string().uuid();

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

  if (
    !idSchema.safeParse(
      id
    ).success
  ) {
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
    error,
  } =
    await supabase
      .from(
        "projects"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    console.error(
      "Project read error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not load project.",
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

  const [
    versionsResult,
    acknowledgementsResult,
  ] = await Promise.all([
    supabase
      .from(
        "project_versions"
      )
      .select(
        "*"
      )
      .eq(
        "project_id",
        id
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      ),
    supabase
      .from(
        "policy_acknowledgements"
      )
      .select(
        "*"
      )
      .eq(
        "project_id",
        id
      )
      .order(
        "acknowledged_at",
        {
          ascending:
            false,
        }
      ),
  ]);

  if (
    versionsResult.error ||
    acknowledgementsResult.error
  ) {
    console.error(
      "Project related-data error:",
      {
        versions:
          versionsResult.error,
        acknowledgements:
          acknowledgementsResult.error,
      }
    );

    return NextResponse.json(
      {
        error:
          "Could not load project history.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    project,
    versions:
      versionsResult.data ??
      [],
    policyAcknowledgements:
      acknowledgementsResult.data ??
      [],
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const {
    id,
  } =
    await context.params;

  if (
    !idSchema.safeParse(
      id
    ).success
  ) {
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
    body =
      await request.json();
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
    projectMutationSchema.safeParse(
      body
    );

  if (
    !parsed.success ||
    Object.keys(
      parsed.data
    ).length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid project update.",
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
      .from(
        "projects"
      )
      .update(
        toProjectRow(
          parsed.data
        )
      )
      .eq(
        "id",
        id
      )
      .select(
        "*"
      )
      .maybeSingle();

  if (error) {
    console.error(
      "Project update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not update project.",
      },
      {
        status: 500,
      }
    );
  }

  if (!data) {
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

  return NextResponse.json({
    project:
      data,
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const {
    id,
  } =
    await context.params;

  if (
    !idSchema.safeParse(
      id
    ).success
  ) {
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

  /*
   * Storage RLS verifies project ownership by
   * checking the projects table. Confirm the row
   * before deleting any private objects, then keep
   * the project row in place until both buckets are
   * clean. Deleting the project first could make
   * its Storage objects impossible to remove with
   * the authenticated user session.
   */
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
      "Project delete ownership lookup error:",
      projectError
    );

    return NextResponse.json(
      {
        error:
          "Could not prepare project deletion.",
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

  let cleanup:
    | Awaited<
        ReturnType<
          typeof deleteProjectStorage
        >
      >
    | null = null;

  try {
    cleanup =
      await deleteProjectStorage(
        supabase,
        userId,
        id
      );
  } catch (cleanupError) {
    console.error(
      "Project private storage cleanup error:",
      cleanupError
    );

    return NextResponse.json(
      {
        error:
          "Could not fully remove the project's private files. The project was kept so deletion can be retried safely.",
        code:
          "PROJECT_STORAGE_CLEANUP_FAILED",
      },
      {
        status: 500,
      }
    );
  }

  const {
    error,
    count,
  } =
    await supabase
      .from(
        "projects"
      )
      .delete({
        count:
          "exact",
      })
      .eq(
        "id",
        id
      )
      .eq(
        "user_id",
        userId
      );

  if (error) {
    console.error(
      "Project delete error after storage cleanup:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Private files were removed, but the project record could not be deleted. Please retry project deletion.",
        code:
          "PROJECT_DATABASE_DELETE_FAILED",
      },
      {
        status: 500,
      }
    );
  }

  if (!count) {
    /*
     * The project existed during the ownership
     * check. A zero count here can only happen if
     * another request removed it concurrently.
     * Treat the final state as successfully deleted.
     */
    return new NextResponse(
      null,
      {
        status: 204,
      }
    );
  }

  console.log(
    "Project deletion completed:",
    {
      projectAssetsDeleted:
        cleanup.projectAssetsDeleted,
      artworkVersionsDeleted:
        cleanup.artworkVersionsDeleted,
    }
  );

  return new NextResponse(
    null,
    {
      status: 204,
    }
  );
}
