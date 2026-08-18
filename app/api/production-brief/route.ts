import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const productionBriefSchema = {
  type: "object",
  properties: {
    visual_objective: {
      type: "string",
    },
    hero_subject: {
      type: "string",
    },
    mandatory_scientific_elements: {
      type: "array",
      items: {
        type: "string",
      },
    },
    scientific_constraints: {
      type: "array",
      items: {
        type: "string",
      },
    },
    composition: {
      type: "string",
    },
    spatial_layout: {
      type: "array",
      items: {
        type: "string",
      },
    },
    materials_and_surfaces: {
      type: "array",
      items: {
        type: "string",
      },
    },
    lighting_and_color: {
      type: "string",
    },
    atmosphere: {
      type: "string",
    },
    allowed_artistic_metaphors: {
      type: "array",
      items: {
        type: "string",
      },
    },
    avoid: {
      type: "array",
      items: {
        type: "string",
      },
    },
    asset_instructions: {
      type: "array",
      items: {
        type: "string",
      },
    },
    image_generation_instruction: {
      type: "string",
    },
  },

  required: [
    "visual_objective",
    "hero_subject",
    "mandatory_scientific_elements",
    "scientific_constraints",
    "composition",
    "spatial_layout",
    "materials_and_surfaces",
    "lighting_and_color",
    "atmosphere",
    "allowed_artistic_metaphors",
    "avoid",
    "asset_instructions",
    "image_generation_instruction",
  ],

  additionalProperties: false,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      abstract,
      journal,
      publisher,
      artworkType,

      selectedConcept,

      visualStyle,
      visualEmphasis,
      visualMood,
      visualNotes,

      assetNotes,
      assetNames,

      realism,
      freedom,
      composition,
      colorDirection,
      preserveAssets,
      artNotes,
    } = body;

    if (!title || !abstract || !selectedConcept) {
      return NextResponse.json(
        {
          error:
            "Title, abstract and selected concept are required.",
        },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
You are the production art director for CoverLab AI.

Your task is to convert a scientifically validated journal-cover concept
into a production brief for an image-generation system.

PRIORITIES, IN ORDER:

1. Scientific accuracy.
2. Fidelity to the selected concept.
3. Fidelity to researcher-supplied art direction.
4. Strong journal-cover composition.
5. Visual impact.

STRICT RULES:

- Never invent scientific findings.
- Never invent a molecular mechanism.
- Never introduce unsupported chemical bonds, structures,
  interactions, kinetic pathways, causal relationships,
  quantitative comparisons, or molecular geometries.
- Treat the selected concept's scientific caution as mandatory.
- Clearly separate real scientific content from artistic metaphor.
- Artistic metaphors are permitted only when they cannot reasonably
  be mistaken for reported scientific observations.
- If uploaded scientific assets should be preserved, explicitly
  instruct the downstream image system not to distort them.
- Avoid decorative scientific-looking elements that have no basis
  in the supplied research.
- Do not write journal logos, mastheads, author names, article titles,
  labels, axes, or other typography into the image-generation prompt
  unless explicitly requested.
- Produce a brief that could be handed directly to a professional
  scientific illustrator or image-generation model.

The final image_generation_instruction should be a coherent,
high-quality production prompt, not a summary of the brief.
      `,

      input: `
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

SELECTED CONCEPT

Title:
${selectedConcept.title}

Central idea:
${selectedConcept.idea}

Scientific elements:
${selectedConcept.scientific_elements.join("\n- ")}

Artistic elements:
${selectedConcept.artistic_elements.join("\n- ")}

Original composition:
${selectedConcept.composition}

Scientific caution:
${selectedConcept.caution}

EARLIER VISUAL DIRECTION

Style:
${visualStyle || "Not specified"}

Scientific emphasis:
${visualEmphasis || "Not specified"}

Mood:
${visualMood || "Not specified"}

Researcher notes:
${visualNotes || "None"}

SCIENTIFIC ASSETS

Uploaded asset names:
${
  assetNames && assetNames.length
    ? assetNames.join(", ")
    : "No assets uploaded"
}

Researcher's asset instructions:
${assetNotes || "None"}

ART DIRECTOR SETTINGS

Scientific realism:
${realism || "Not specified"}

Artistic freedom:
${freedom || "Not specified"}

Composition preference:
${composition || "Not specified"}

Color direction:
${colorDirection || "Not specified"}

Preserve uploaded scientific assets:
${preserveAssets ? "Yes" : "No"}

Additional art direction:
${artNotes || "None"}

Build a production brief suitable for generating one strong,
scientifically responsible journal-cover artwork.
      `,

      text: {
        format: {
          type: "json_schema",
          name: "production_brief",
          strict: true,
          schema: productionBriefSchema,
        },
      },
    });

    if (!response.output_text) {
      return NextResponse.json(
        {
          error: "No production brief was returned.",
        },
        { status: 500 }
      );
    }

    const result = JSON.parse(response.output_text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Production brief error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build production brief.",
      },
      { status: 500 }
    );
  }
}