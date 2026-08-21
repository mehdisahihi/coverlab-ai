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

const acknowledgementSchema =
  z
    .object({
      publisher:
        z
          .string()
          .trim()
          .min(1)
          .max(500),
      journal:
        z
          .string()
          .trim()
          .min(1)
          .max(500),
      artworkType:
        z
          .string()
          .trim()
          .min(1)
          .max(100),
      policyId:
        z
          .string()
          .trim()
          .max(500)
          .nullable()
          .optional(),
      policyStatus:
        z.enum([
          "allowed",
          "conditional",
          "not-allowed",
          "manual-check",
        ]),
      acknowledgementText:
        z
          .string()
          .trim()
          .min(1)
          .max(5000),
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
    acknowledgementSchema.safeParse(
      body
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid policy acknowledgement data.",
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
        "policy_acknowledgements"
      )
      .insert({
        project_id:
          id,
        user_id:
          userId,
        publisher:
          parsed.data.publisher,
        journal:
          parsed.data.journal,
        artwork_type:
          parsed.data.artworkType,
        policy_id:
          parsed.data.policyId ??
          null,
        policy_status:
          parsed.data.policyStatus,
        acknowledgement_text:
          parsed.data.acknowledgementText,
      })
      .select(
        "*"
      )
      .single();

  if (error) {
    console.error(
      "Policy acknowledgement create error:",
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
            : "Could not save policy acknowledgement.",
      },
      {
        status,
      }
    );
  }

  return NextResponse.json(
    {
      acknowledgement:
        data,
    },
    {
      status: 201,
    }
  );
}
