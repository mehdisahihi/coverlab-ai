import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      imageGenerationInstruction,
      scientificConstraints,
      avoid,
    } = body;

    if (!imageGenerationInstruction) {
      return NextResponse.json(
        { error: "Image generation instruction is required." },
        { status: 400 }
      );
    }

    const prompt = `
Create a premium vertical scientific journal-cover artwork.

PRIMARY PRODUCTION INSTRUCTION:

${imageGenerationInstruction}

MANDATORY SCIENTIFIC CONSTRAINTS:

${
  scientificConstraints?.length
    ? scientificConstraints.map((item: string) => `- ${item}`).join("\n")
    : "- Preserve scientific plausibility and do not invent unsupported findings."
}

DO NOT INCLUDE:

${
  avoid?.length
    ? avoid.map((item: string) => `- ${item}`).join("\n")
    : "- Unsupported scientific elements."
}

GENERAL COVER REQUIREMENTS:

- Produce artwork only, with no journal masthead, logo, title, author names,
  labels, captions, axes, or decorative typography.
- Maintain a premium scientific-journal aesthetic.
- Strong visual hierarchy and a clear primary focal point.
- Leave useful negative space near the top for a possible journal masthead.
- Keep scientific subjects recognizable rather than converting them into
  generic fantasy forms.
- Artistic lighting and atmosphere are allowed, but must not imply
  unsupported scientific mechanisms.
- Avoid meaningless floating molecular symbols or fake scientific diagrams.
- Vertical journal-cover composition.
`;

    const image = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      n: 1,
      size: "1024x1536",
      quality: "medium",
      output_format: "png",
    });

    const base64 = image.data?.[0]?.b64_json;

    if (!base64) {
      return NextResponse.json(
        { error: "No image was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: `data:image/png;base64,${base64}`,
    });
  } catch (error) {
    console.error("Artwork generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate artwork.",
      },
      { status: 500 }
    );
  }
}