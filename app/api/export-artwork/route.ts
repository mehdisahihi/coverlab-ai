import { NextResponse } from "next/server";
import sharp from "sharp";
import { findExportProfile } from "../../../lib/journalProfiles";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      image,
      publisher,
      artworkType,
    } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Artwork image is required." },
        { status: 400 }
      );
    }

    const profile = findExportProfile(
      publisher,
      artworkType
    );

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "No verified export profile is available for this publisher/artwork combination yet.",
        },
        { status: 400 }
      );
    }

    if (profile.aiStatus === "not-allowed") {
      return NextResponse.json(
        {
          error:
            "Current publisher guidance does not generally permit this type of generative-AI artwork. Manual verification is required.",
        },
        { status: 400 }
      );
    }

    const base64 = image.replace(
      /^data:image\/\w+;base64,/,
      ""
    );

    const inputBuffer =
      Buffer.from(base64, "base64");

    const metadata =
      await sharp(inputBuffer).metadata();

    const sourceWidth =
      metadata.width ?? 0;

    const sourceHeight =
      metadata.height ?? 0;

    let pipeline = sharp(inputBuffer)
      .resize(
        profile.widthPx,
        profile.heightPx,
        {
          fit: "cover",
          position: "centre",
          kernel: sharp.kernel.lanczos3,
        }
      )
      .withMetadata({
        density: profile.dpi,
      });

    let outputBuffer: Buffer;
    let mimeType: string;

    if (profile.format === "TIFF") {
      outputBuffer =
        await pipeline
          .tiff({
            compression: "lzw",
          })
          .toBuffer();

      mimeType = "image/tiff";
    } else if (profile.format === "JPEG") {
      outputBuffer =
        await pipeline
          .jpeg({
            quality: 95,
          })
          .toBuffer();

      mimeType = "image/jpeg";
    } else {
      outputBuffer =
        await pipeline
          .png()
          .toBuffer();

      mimeType = "image/png";
    }

    const wasUpscaled =
      sourceWidth < profile.widthPx ||
      sourceHeight < profile.heightPx;

    return NextResponse.json({
      file: `data:${mimeType};base64,${outputBuffer.toString(
        "base64"
      )}`,

      profile: {
        id: profile.id,

        widthPx:
          profile.widthPx,

        heightPx:
          profile.heightPx,

        dpi:
          profile.dpi,

        format:
          profile.format,

        widthPhysical:
          profile.widthPhysical,

        heightPhysical:
          profile.heightPhysical,

        aiStatus:
          profile.aiStatus,

        disclosureRequired:
          profile.disclosureRequired,
      },

      source: {
        widthPx: sourceWidth,
        heightPx: sourceHeight,
      },

      wasUpscaled,
    });
  } catch (error) {
    console.error(
      "Publication export error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare publication export.",
      },
      { status: 500 }
    );
  }
}