import {
  NextResponse,
} from "next/server";
import {
  z,
} from "zod";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";

const idSchema =
  z.string().uuid();

const versionSchema =
  z
    .object({
      operation:
        z.enum([
          "generation",
          "refinement",
          "enhancement",
        ]),
      sourceVersionId:
        z
          .string()
          .uuid()
          .nullable()
          .optional(),
      imagePath:
        z
          .string()
          .trim()
          .max(2000)
          .nullable()
          .optional(),
      metadata:
        z
          .record(
            z.unknown()
          )
          .optional(),
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
    versionSchema.safeParse(
      body
    );

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

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "project_versions"
      )
      .insert({
        project_id:
          id,
        user_id:
          userId,
        operation:
          parsed.data.operation,
        source_version_id:
          parsed.data.sourceVersionId ??
          null,
        image_path:
          parsed.data.imagePath ??
          null,
        metadata:
          parsed.data.metadata ??
          {},
      })
      .select(
        "*"
      )
      .single();

  if (error) {
    console.error(
      "Project version create error:",
      error
    );

    const status =
      error.code ===
      "42501"
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
      version:
        data,
    },
    {
      status: 201,
    }
  );
}
