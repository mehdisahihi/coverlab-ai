import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod/v3";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const Concept = z.object({
  title: z.string(),
  idea: z.string(),
  scientific_elements: z.array(z.string()),
  artistic_elements: z.array(z.string()),
  composition: z.string(),
  caution: z.string(),
});

const CoverConceptResponse = z.object({
  scientific_summary: z.string(),
  concepts: z.array(Concept).length(3),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      abstract,
      journal,
      publisher,
      artworkType,
      style,
      emphasis,
      mood,
      visualNotes,
    } = body;

    if (!title || !abstract) {
      return NextResponse.json(
        { error: "Title and abstract are required." },
        { status: 400 }
      );
    }

    const response = await openai.responses.parse({
      model: "gpt-5.6-luna",

      input: [
        {
          role: "system",
          content: `
You are the scientific art director for CoverLab AI.

Your job is to transform scientific research into strong journal-cover
visual concepts.

Rules:
- Do not invent scientific findings.
- Stay strictly faithful to the supplied research.
- Distinguish scientific content from artistic metaphor.
- Do not add unsupported mechanisms, molecular structures,
  interactions, conclusions, or causal claims.
- Generate exactly three visually distinct concepts.
- Each concept must be useful to a professional scientific illustrator
  or downstream image-generation system.
- Scientific accuracy is more important than visual drama.
          `,
        },
        {
          role: "user",
          content: `
RESEARCH

Title:
${title}

Abstract:
${abstract}

TARGET PUBLICATION

Publisher:
${publisher || "Not specified"}

Journal:
${journal || "Not specified"}

Artwork type:
${artworkType || "Not specified"}

VISUAL DIRECTION

Style:
${style || "Not specified"}

Scientific emphasis:
${emphasis || "Not specified"}

Mood:
${mood || "Not specified"}

Additional researcher instructions:
${visualNotes || "None"}

Generate three distinct journal-cover concepts.
          `,
        },
      ],

      text: {
        format: zodTextFormat(
          CoverConceptResponse,
          "cover_concept_response"
        ),
      },
    });

    const result = response.output_parsed;

    if (!result) {
      return NextResponse.json(
        { error: "No structured output was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Concept generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate concepts.",
      },
      { status: 500 }
    );
  }
}