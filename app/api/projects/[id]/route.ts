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
      );

  if (error) {
    console.error(
      "Project delete error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not delete project.",
      },
      {
        status: 500,
      }
    );
  }

  if (!count) {
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

  return new NextResponse(
    null,
    {
      status: 204,
    }
  );
}
