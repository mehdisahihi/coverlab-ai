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

    const isGraphicalAbstract =
  artworkType ===
  "Graphical Abstract";

const artworkRoleInstruction =
  isGraphicalAbstract
    ? `
GRAPHICAL ABSTRACT MODE

This production brief is for a GRAPHICAL ABSTRACT.

The primary purpose is scientific communication,
not decorative cover art.

Prioritize:

- immediate comprehension of the central scientific message,
- clear visual hierarchy,
- a logical reading direction,
- clear relationships between scientifically supported elements,
- restrained composition,
- strong separation between stages, objects, or concepts,
- minimal visual clutter,
- scientifically meaningful spatial organization,
- accurate representation of supplied scientific assets.

The composition may use:

- left-to-right progression,
- top-to-bottom progression,
- central-process layouts,
- before/after relationships,
- input-process-output organization,

but ONLY when those relationships are supported by the research.

Do not invent arrows, causal pathways, mechanisms,
transformations, or process stages unless explicitly supported.

Avoid making the graphical abstract look like:

- journal-cover artwork,
- cinematic concept art,
- an advertising poster,
- a decorative scientific scene.

TEXT AND LABELS

Do not invent text, labels, formulas, equations,
numeric values, legends, or annotations.

If text is scientifically necessary, describe where
a researcher-supplied label could later be placed rather
than asking the image model to generate typography.

The image-generation instruction should focus on
a clean scientific communication layout.
`
    : `
JOURNAL COVER MODE

This production brief is for JOURNAL COVER artwork.

The primary purpose is scientifically responsible,
editorially compelling visual storytelling.

Prioritize:

- a strong focal subject,
- visual impact at cover scale,
- elegant scientific metaphor where justified,
- sophisticated depth, materials, lighting and atmosphere,
- coherent visual hierarchy,
- clear negative space where journal branding or masthead
  may later be placed,
- scientific fidelity even when the visual treatment
  is artistic.

The cover should feel like premium scientific editorial artwork,
not like a data figure or graphical abstract.

Avoid:

- panel-based infographic layouts,
- excessive arrows,
- schematic process diagrams,
- dense explanatory structure,
- decorative equations,
- labels,
- article titles,
- journal logos,
- mastheads,
- generated typography.

The image-generation instruction should describe
one unified, visually powerful cover composition.
`;

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

${isGraphicalAbstract
  ? `Build a production brief for one clear, scientifically responsible graphical abstract.

The result should communicate the central scientific story efficiently
and should NOT be treated as journal-cover artwork.`
  : `Build a production brief for one premium, scientifically responsible journal-cover artwork.

The result should prioritize editorial visual impact while preserving
scientific meaning and should NOT resemble a graphical abstract.`}
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