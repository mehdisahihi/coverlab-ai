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
  projectAssetFromRow,
  PROJECT_ASSET_BUCKET,
  PROJECT_ASSET_MAX_BYTES,
  type ProjectAssetRow,
} from "@/lib/storage/projectAssets";

const idSchema =
  z.string().uuid();

const confirmSchema =
  z.object({
    assetId:
      z.string().uuid(),
    objectPath:
      z.string().min(1).max(1024),
    originalName:
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

async function ownedProjectExists(
  supabase: Awaited<
    ReturnType<
      typeof getAuthenticatedContext
    >
  >["supabase"],
  id: string
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

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
      .from("project_assets")
      .select(
        "id,project_id,bucket_id,object_path,original_name,mime_type,size_bytes,created_at"
      )
      .eq("project_id", id)
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Project asset list error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not load project assets.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    assets:
      (data ?? []).map(
        (row) =>
          projectAssetFromRow(
            row as ProjectAssetRow
          )
      ),
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
    confirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid asset confirmation data.",
        issues:
          parsed.error.flatten(),
      },
      {
        status: 400,
      }
    );
  }

  try {
    if (
      !(await ownedProjectExists(
        supabase,
        id
      ))
    ) {
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
  } catch (error) {
    console.error(
      "Asset confirmation project lookup error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not confirm the project asset.",
      },
      {
        status: 500,
      }
    );
  }

  const extension =
    fileExtension(
      parsed.data.originalName
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

  const expectedPath =
    `${userId}/${id}/${parsed.data.assetId}.${extension}`;

  if (
    parsed.data.objectPath !==
    expectedPath
  ) {
    return NextResponse.json(
      {
        error:
          "Asset path does not match the authenticated project.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: existing,
    error: existingError,
  } =
    await supabase
      .from("project_assets")
      .select(
        "id,project_id,bucket_id,object_path,original_name,mime_type,size_bytes,created_at"
      )
      .eq("id", parsed.data.assetId)
      .maybeSingle();

  if (existingError) {
    console.error(
      "Project asset idempotency lookup error:",
      existingError
    );

    return NextResponse.json(
      {
        error:
          "Could not confirm the project asset.",
      },
      {
        status: 500,
      }
    );
  }

  if (existing) {
    if (
      existing.project_id !== id ||
      existing.object_path !==
        parsed.data.objectPath
    ) {
      return NextResponse.json(
        {
          error:
            "Asset id is already associated with another object.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      asset:
        projectAssetFromRow(
          existing as ProjectAssetRow
        ),
    });
  }

  const folder =
    `${userId}/${id}`;
  const fileName =
    `${parsed.data.assetId}.${extension}`;

  const {
    data: objects,
    error: storageError,
  } =
    await supabase.storage
      .from(PROJECT_ASSET_BUCKET)
      .list(folder, {
        limit: 100,
        search: fileName,
      });

  if (storageError) {
    console.error(
      "Project asset storage verification error:",
      storageError
    );

    return NextResponse.json(
      {
        error:
          "Could not verify the uploaded asset.",
      },
      {
        status: 500,
      }
    );
  }

  if (
    !(objects ?? []).some(
      (object) =>
        object.name === fileName
    )
  ) {
    return NextResponse.json(
      {
        error:
          "The uploaded asset could not be found in private storage.",
      },
      {
        status: 409,
      }
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("project_assets")
      .insert({
        id:
          parsed.data.assetId,
        project_id: id,
        user_id: userId,
        bucket_id:
          PROJECT_ASSET_BUCKET,
        object_path:
          parsed.data.objectPath,
        original_name:
          parsed.data.originalName,
        mime_type:
          parsed.data.mimeType,
        size_bytes:
          parsed.data.sizeBytes,
      })
      .select(
        "id,project_id,bucket_id,object_path,original_name,mime_type,size_bytes,created_at"
      )
      .single();

  if (error) {
    console.error(
      "Project asset metadata insert error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not save project asset metadata.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      asset:
        projectAssetFromRow(
          data as ProjectAssetRow
        ),
    },
    {
      status: 201,
    }
  );
}
