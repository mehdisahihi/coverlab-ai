import {
  NextResponse,
} from "next/server";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  projectMutationSchema,
  toProjectRow,
} from "@/lib/projects/input";

export async function GET() {
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
      .from(
        "projects"
      )
      .select(
        "id,name,research_title,publisher,journal,artwork_type,current_step,created_at,updated_at"
      )
      .order(
        "updated_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    console.error(
      "Project list error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not load projects.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    projects:
      data ?? [],
  });
}

export async function POST(
  request: Request
) {
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

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid project data.",
        issues:
          parsed.error.flatten(),
      },
      {
        status: 400,
      }
    );
  }

  const row =
    toProjectRow(
      parsed.data
    );

  const fallbackName =
    parsed.data.name ||
    parsed.data.researchTitle ||
    "Untitled project";

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "projects"
      )
      .insert({
        user_id:
          userId,
        name:
          fallbackName,
        ...row,
      })
      .select(
        "*"
      )
      .single();

  if (error) {
    console.error(
      "Project create error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not create project.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      project:
        data,
    },
    {
      status: 201,
    }
  );
}
