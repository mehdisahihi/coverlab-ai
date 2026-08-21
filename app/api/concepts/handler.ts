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

    const isGraphicalAbstract =
  artworkType === "Graphical Abstract";

const conceptModeInstruction =
  isGraphicalAbstract
    ? `
GRAPHICAL ABSTRACT MODE

The requested artwork is a GRAPHICAL ABSTRACT.

Its primary purpose is to communicate the central scientific
message quickly and accurately.

Develop concepts around:

- clear scientific hierarchy,
- logical reading direction,
- scientifically meaningful relationships,
- restrained visual organization,
- immediate comprehension,
- efficient use of space,
- clear distinction between major scientific elements.

Possible organizational strategies include:

- left-to-right progression,
- top-to-bottom progression,
- central-process organization,
- input-process-output organization,
- comparison or before/after organization,

but ONLY when those relationships are explicitly supported
by the supplied research.

Do not invent:

- arrows,
- mechanisms,
- transformations,
- causal pathways,
- molecular interactions,
- process stages,
- formulas,
- equations,
- quantitative relationships,
- labels or annotations

unless they are explicitly supported by the research.

Artistic elements should support comprehension rather than
turning the graphical abstract into cinematic concept art.

The three concepts must represent genuinely different ways
of communicating the same supported scientific story.
`
    : `
JOURNAL COVER MODE

The requested artwork is JOURNAL COVER artwork.

Its primary purpose is scientifically responsible,
editorially compelling visual storytelling.

Develop concepts around:

- one strong focal subject,
- memorable visual storytelling,
- sophisticated composition,
- depth and atmosphere,
- scientifically justified artistic metaphor,
- premium editorial visual impact,
- useful negative space for later masthead placement.

The artwork should feel like professional scientific
journal-cover art rather than a graphical abstract,
diagram, infographic, or data figure.

Avoid:

- panel-heavy layouts,
- explanatory flowcharts,
- excessive arrows,
- dense schematic organization,
- decorative equations,
- labels,
- journal logos,
- mastheads,
- article titles,
- generated typography.

The three concepts must be visually distinct while remaining
faithful to the same scientific research.
`;

    const response = await openai.responses.parse({
      model: "gpt-5.6-luna",

      input: [
        {
          role: "system",
          content: `
          You are the scientific art director for CoverLab AI.

          Your job is to transform scientific research into strong,
          scientifically responsible publication-artwork concepts.

          ${conceptModeInstruction}

          CORE RULES:

          - Do not invent scientific findings.
          - Stay strictly faithful to the supplied research.
          - Distinguish scientific content from artistic metaphor.
          - Do not add unsupported mechanisms, molecular structures,
            interactions, conclusions, transformations, or causal claims.
          - Do not fabricate scientific-looking content simply to make
            the artwork appear more sophisticated.
          - Treat scientific uncertainty conservatively.
          - Generate exactly three genuinely distinct visual concepts.
          - Each concept must be useful to a professional scientific
            illustrator or downstream image-generation system.
          - Scientific accuracy is more important than visual drama.

          SCIENTIFIC ELEMENTS

          The scientific_elements field should contain only elements
           that are supported by the supplied research.

          ARTISTIC ELEMENTS

          The artistic_elements field may contain visual treatment,
           metaphor, atmosphere, materials, lighting, abstraction,
           or organizational devices, but they must not imply unsupported
           scientific findings.

          COMPOSITION

          The composition field must describe a composition appropriate
           for the selected artwork type.

          CAUTION

          The caution field must explicitly identify the most important
           scientific risk that the illustrator or image-generation system
           must avoid for that concept.
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

${isGraphicalAbstract
  ? `Generate exactly three distinct graphical-abstract concepts.

Each concept must communicate the same scientifically supported
research story using a meaningfully different visual organization.

Prioritize scientific communication, hierarchy and clarity over
cinematic or decorative visual impact.`
  : `Generate exactly three distinct journal-cover concepts.

Each concept must transform the same scientifically supported
research story into a meaningfully different editorial visual direction.

Prioritize scientific accuracy, strong visual storytelling and
premium cover-level composition.`}
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