import sharp from "sharp";

import {
  findExactProfile,
  normalizeArtworkType,
  resolvePublicationRules,
} from "../../../lib/publicationRegistry";

export const runtime = "nodejs";

type ExportFormat =
  | "PNG"
  | "JPEG"
  | "TIFF";

function normalizeFormat(
  value: string
): ExportFormat | null {
  const normalized =
    value.trim().toUpperCase();

  if (normalized === "PNG") {
    return "PNG";
  }

  if (
    normalized === "JPEG" ||
    normalized === "JPG"
  ) {
    return "JPEG";
  }

  if (
    normalized === "TIFF" ||
    normalized === "TIF"
  ) {
    return "TIFF";
  }

  return null;
}

function extensionForFormat(
  format: ExportFormat
) {
  if (format === "JPEG") {
    return "jpg";
  }

  if (format === "TIFF") {
    return "tif";
  }

  return "png";
}

function mimeForFormat(
  format: ExportFormat
) {
  if (format === "JPEG") {
    return "image/jpeg";
  }

  if (format === "TIFF") {
    return "image/tiff";
  }

  return "image/png";
}

function safeFilenamePart(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(0, 80);
}

function readNumber(
  formData: FormData,
  name: string
) {
  const value =
    formData.get(name);

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const imageEntry =
      formData.get("image");

    const publisherEntry =
      formData.get("publisher");

    const journalEntry =
      formData.get("journal");

    const artworkTypeEntry =
      formData.get(
        "artworkType"
      );

    const formatEntry =
      formData.get("format");

    const sourceModeEntry =
      formData.get(
        "sourceMode"
      );

    const versionEntry =
      formData.get(
        "version"
      );

    if (
      !imageEntry ||
      typeof imageEntry ===
        "string"
    ) {
      return Response.json(
        {
          error:
            "Artwork image file is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof publisherEntry !==
        "string" ||
      typeof journalEntry !==
        "string" ||
      typeof artworkTypeEntry !==
        "string" ||
      typeof formatEntry !==
        "string"
    ) {
      return Response.json(
        {
          error:
            "Publication information is incomplete.",
        },
        {
          status: 400,
        }
      );
    }

    const publisher =
      publisherEntry.trim();

    const journal =
      journalEntry.trim();

    const artworkType =
      normalizeArtworkType(
        artworkTypeEntry
      );

    const requestedFormat =
      normalizeFormat(
        formatEntry
      );

    if (!requestedFormat) {
      return Response.json(
        {
          error:
            "Unsupported export format.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Re-resolve the publication profile
      on the server.

      Never trust dimensions sent by
      the browser.
    */

    const profile =
      findExactProfile(
        publisher,
        journal,
        artworkType
      );

    if (!profile) {
      return Response.json(
        {
          error:
            "CoverLab does not have a verified exact export profile for this publication and artwork type.",
        },
        {
          status: 400,
        }
      );
    }

    const rules =
      resolvePublicationRules(
        publisher,
        journal,
        artworkType
      );

    /*
      A technically valid image should not
      be labelled a publication-ready file
      when stored policy explicitly prohibits
      AI imagery for this submission type.
    */

    if (
      rules.aiPolicy.status ===
      "not-allowed"
    ) {
      return Response.json(
        {
          error:
            "Current stored publication policy does not permit this AI-generated artwork for this submission type. Publication export is blocked.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Only raster formats supported by both
      our export engine and the stored profile
      may be produced.
    */

    const normalizedProfileFormats =
      profile.formats
        .map(
          (format) =>
            normalizeFormat(
              format
            )
        )
        .filter(
          (
            format
          ): format is ExportFormat =>
            Boolean(format)
        );

    if (
      !normalizedProfileFormats.includes(
        requestedFormat
      )
    ) {
      return Response.json(
        {
          error:
            `${requestedFormat} is not listed as a supported raster format in the verified publication profile.`,
        },
        {
          status: 400,
        }
      );
    }

    const sourceMode =
      sourceModeEntry ===
      "enhanced"
        ? "enhanced"
        : "native";

    const arrayBuffer =
      await imageEntry.arrayBuffer();

    const inputBuffer =
      Buffer.from(
        arrayBuffer
      );

    const inputMetadata =
      await sharp(
        inputBuffer
      ).metadata();

    if (
      !inputMetadata.width ||
      !inputMetadata.height
    ) {
      return Response.json(
        {
          error:
            "Could not determine artwork dimensions.",
        },
        {
          status: 400,
        }
      );
    }

    let pipeline =
      sharp(inputBuffer);

    /*
      Native mode:

      Use the exact researcher-approved crop.

      Enhanced mode:

      The enhanced candidate is already based
      on the approved crop, so no second scientific
      crop should be applied.
    */

    if (
      sourceMode ===
      "native"
    ) {
      const cropX =
        readNumber(
          formData,
          "cropX"
        );

      const cropY =
        readNumber(
          formData,
          "cropY"
        );

      const cropWidth =
        readNumber(
          formData,
          "cropWidth"
        );

      const cropHeight =
        readNumber(
          formData,
          "cropHeight"
        );

      if (
        cropX === null ||
        cropY === null ||
        cropWidth === null ||
        cropHeight === null
      ) {
        return Response.json(
          {
            error:
              "Approved crop geometry is required for native export.",
          },
          {
            status: 400,
          }
        );
      }

      /*
        Sharp extract requires integer values.

        Clamp the approved crop to the real
        source-image boundaries.
      */

      const left =
        Math.max(
          0,
          Math.min(
            Math.round(
              cropX
            ),
            inputMetadata.width -
              1
          )
        );

      const top =
        Math.max(
          0,
          Math.min(
            Math.round(
              cropY
            ),
            inputMetadata.height -
              1
          )
        );

      const width =
        Math.max(
          1,
          Math.min(
            Math.round(
              cropWidth
            ),
            inputMetadata.width -
              left
          )
        );

      const height =
        Math.max(
          1,
          Math.min(
            Math.round(
              cropHeight
            ),
            inputMetadata.height -
              top
          )
        );

      pipeline =
        pipeline.extract({
          left,
          top,
          width,
          height,
        });
    }

    /*
      Preserve aspect ratio while reaching
      the exact journal dimensions.

      Because both native crop and enhanced
      candidate already use the approved
      publication framing, any adjustment
      here should be extremely small.
    */

    pipeline =
      pipeline
        .resize(
          profile.widthPx,
          profile.heightPx,
          {
            fit: "cover",

            position:
              "centre",

            kernel:
              sharp.kernel
                .lanczos3,
          }
        )
        .withMetadata({
          density:
            profile.dpi,
        });

    let outputBuffer: Buffer;

    if (
      requestedFormat ===
      "TIFF"
    ) {
      outputBuffer =
        await pipeline
          .tiff({
            compression:
              "lzw",

            quality:
              100,
          })
          .toBuffer();
    } else if (
      requestedFormat ===
      "JPEG"
    ) {
      outputBuffer =
        await pipeline
          .jpeg({
            quality:
              95,

            chromaSubsampling:
              "4:4:4",

            mozjpeg:
              true,
          })
          .toBuffer();
    } else {
      outputBuffer =
        await pipeline
          .png({
            compressionLevel:
              9,

            adaptiveFiltering:
              true,
          })
          .toBuffer();
    }

    /*
      VERIFY THE OUTPUT.

      Never simply assume Sharp produced
      what we requested.
    */

    const outputMetadata =
      await sharp(
        outputBuffer
      ).metadata();

    const dimensionsValid =
      outputMetadata.width ===
        profile.widthPx &&
      outputMetadata.height ===
        profile.heightPx;

    if (!dimensionsValid) {
      console.error(
        "Publication export verification failed:",
        {
          expected:
            `${profile.widthPx}x${profile.heightPx}`,

          actual:
            `${outputMetadata.width}x${outputMetadata.height}`,
        }
      );

      return Response.json(
        {
          error:
            "Final export dimensions failed verification.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Density reporting depends slightly on
      format/metadata support, so expose the
      value that Sharp reads back for the user.
    */

    const verifiedDensity =
      outputMetadata.density ??
      profile.dpi;

    const extension =
      extensionForFormat(
        requestedFormat
      );

    const safeJournal =
      safeFilenamePart(
        journal ||
          publisher ||
          "publication"
      );

    const safeArtworkType =
      safeFilenamePart(
        artworkType
      );

    const safeVersion =
      typeof versionEntry ===
        "string" &&
      versionEntry
        ? safeFilenamePart(
            versionEntry
          )
        : "selected";

    const filename =
      `coverlab-${safeJournal}-${safeArtworkType}-${safeVersion}-${profile.widthPx}x${profile.heightPx}-${profile.dpi}dpi.${extension}`;

    console.log(
      "Publication export verified:",
      {
        publisher,

        journal,

        artworkType,

        sourceMode,

        format:
          requestedFormat,

        width:
          outputMetadata.width,

        height:
          outputMetadata.height,

        density:
          verifiedDensity,

        bytes:
          outputBuffer.length,

        policy:
          rules.aiPolicy.status,
      }
    );

    return new Response(
      new Uint8Array(
        outputBuffer
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            mimeForFormat(
              requestedFormat
            ),

          "Content-Length":
            outputBuffer.length.toString(),

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "no-store",

          "X-CoverLab-Width":
            profile.widthPx.toString(),

          "X-CoverLab-Height":
            profile.heightPx.toString(),

          "X-CoverLab-DPI":
            verifiedDensity.toString(),

          "X-CoverLab-Format":
            requestedFormat,

          "X-CoverLab-Policy-Status":
            rules.aiPolicy.status,

          "X-CoverLab-Source-Mode":
            sourceMode,
        },
      }
    );
  } catch (error) {
    console.error(
      "Publication export error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create publication export.",
      },
      {
        status: 500,
      }
    );
  }
}