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
  PROJECT_ASSET_BUCKET,
} from "@/lib/storage/projectAssets";

const uuidSchema =
  z.string().uuid();

type RouteContext = {
  params: Promise<{
    id: string;
    assetId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const {
    id,
    assetId,
  } =
    await context.params;

  if (
    !uuidSchema.safeParse(id).success ||
    !uuidSchema.safeParse(assetId).success
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid project or asset id.",
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
    data: asset,
    error: lookupError,
  } =
    await supabase
      .from("project_assets")
      .select(
        "id,project_id,bucket_id,object_path"
      )
      .eq("id", assetId)
      .eq("project_id", id)
      .maybeSingle();

  if (lookupError) {
    console.error(
      "Project asset delete lookup error:",
      lookupError
    );

    return NextResponse.json(
      {
        error:
          "Could not remove the project asset.",
      },
      {
        status: 500,
      }
    );
  }

  if (!asset) {
    return NextResponse.json(
      {
        error:
          "Project asset not found.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    asset.bucket_id !==
    PROJECT_ASSET_BUCKET
  ) {
    return NextResponse.json(
      {
        error:
          "Unexpected project asset bucket.",
      },
      {
        status: 409,
      }
    );
  }

  const {
    error: storageError,
  } =
    await supabase.storage
      .from(PROJECT_ASSET_BUCKET)
      .remove([
        asset.object_path,
      ]);

  if (storageError) {
    console.error(
      "Project asset object delete error:",
      storageError
    );

    return NextResponse.json(
      {
        error:
          "Could not remove the private asset object.",
      },
      {
        status: 500,
      }
    );
  }

  const {
    error: metadataError,
  } =
    await supabase
      .from("project_assets")
      .delete()
      .eq("id", assetId)
      .eq("project_id", id);

  if (metadataError) {
    console.error(
      "Project asset metadata delete error:",
      metadataError
    );

    return NextResponse.json(
      {
        error:
          "The asset object was removed, but its metadata could not be cleaned up.",
      },
      {
        status: 500,
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
