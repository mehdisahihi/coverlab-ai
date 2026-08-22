import sharp from "sharp";
import { z } from "zod";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  ARTWORK_VERSION_BUCKET,
} from "@/lib/storage/artworkVersions";

export const runtime = "nodejs";

const idSchema =
  z.string().uuid();

type DownloadFormat =
  | "PNG"
  | "TIFF";

type RouteContext = {
  params: Promise<{
    id: string;
    versionId: string;
  }>;
};

function normalizeFormat(
  value: string | null
): DownloadFormat | null {
  const normalized =
    (value ?? "PNG")
      .trim()
      .toUpperCase();

  if (normalized === "PNG") {
    return "PNG";
  }

  if (
    normalized === "TIFF" ||
    normalized === "TIF"
  ) {
    return "TIFF";
  }

  return null;
}

function safeOperation(
  value: unknown
) {
  return value === "generation" ||
    value === "refinement" ||
    value === "enhancement"
      ? value
      : "artwork";
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const {
    id,
    versionId,
  } =
    await context.params;

  if (
    !idSchema.safeParse(id).success ||
    !idSchema.safeParse(versionId).success
  ) {
    return Response.json(
      {
        error:
          "Invalid artwork version request.",
      },
      {
        status: 400,
      }
    );
  }

  const format =
    normalizeFormat(
      new URL(request.url)
        .searchParams
        .get("format")
    );

  if (!format) {
    return Response.json(
      {
        error:
          "Supported version download formats are PNG and TIFF.",
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
    return Response.json(
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
    data: version,
    error: versionError,
  } =
    await supabase
      .from("project_versions")
      .select(
        "id,project_id,operation,image_path"
      )
      .eq("id", versionId)
      .eq("project_id", id)
      .eq("user_id", userId)
      .maybeSingle();

  if (versionError) {
    console.error(
      "Artwork version download lookup error:",
      versionError
    );

    return Response.json(
      {
        error:
          "Could not load the requested artwork version.",
      },
      {
        status: 500,
      }
    );
  }

  if (
    !version ||
    typeof version.image_path !== "string" ||
    !version.image_path
  ) {
    return Response.json(
      {
        error:
          "Artwork version not found.",
      },
      {
        status: 404,
      }
    );
  }

  const {
    data: storedBlob,
    error: storageError,
  } =
    await supabase.storage
      .from(
        ARTWORK_VERSION_BUCKET
      )
      .download(
        version.image_path
      );

  if (
    storageError ||
    !storedBlob
  ) {
    console.error(
      "Artwork version download storage error:",
      storageError
    );

    return Response.json(
      {
        error:
          "Could not retrieve the private artwork file.",
      },
      {
        status: 500,
      }
    );
  }

  const inputBuffer =
    Buffer.from(
      await storedBlob.arrayBuffer()
    );

  if (inputBuffer.length === 0) {
    return Response.json(
      {
        error:
          "Stored artwork file is empty.",
      },
      {
        status: 500,
      }
    );
  }

  let outputBuffer: Buffer;
  let extension: string;
  let contentType: string;

  if (format === "TIFF") {
    outputBuffer =
      await sharp(inputBuffer)
        .tiff({
          compression: "lzw",
          quality: 100,
        })
        .toBuffer();

    extension = "tif";
    contentType = "image/tiff";
  } else {
    /*
      Stored artwork versions are canonical PNGs.
      Re-encode here so the download route always
      returns a verified PNG payload.
    */
    outputBuffer =
      await sharp(inputBuffer)
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toBuffer();

    extension = "png";
    contentType = "image/png";
  }

  const metadata =
    await sharp(outputBuffer)
      .metadata();

  if (
    !metadata.width ||
    !metadata.height
  ) {
    return Response.json(
      {
        error:
          "Could not verify the converted artwork file.",
      },
      {
        status: 500,
      }
    );
  }

  const operation =
    safeOperation(
      version.operation
    );

  const filename =
    `coverlab-${operation}-${versionId.slice(0, 8)}-${metadata.width}x${metadata.height}.${extension}`;

  return new Response(
    new Uint8Array(
      outputBuffer
    ),
    {
      status: 200,
      headers: {
        "Content-Type":
          contentType,
        "Content-Length":
          outputBuffer.length.toString(),
        "Content-Disposition":
          `attachment; filename="${filename}"`,
        "Cache-Control":
          "no-store",
        "X-CoverLab-Version-Format":
          format,
        "X-CoverLab-Width":
          metadata.width.toString(),
        "X-CoverLab-Height":
          metadata.height.toString(),
      },
    }
  );
}
