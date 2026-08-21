import { NextResponse } from "next/server";

import {
  enforceAiOperation,
} from "../../../lib/publications/enforcement";

type ReferenceImage = {
  name: string;
  dataUrl: string;
};

type RefineArtworkRequest = {
  currentImage: string;

  publisher?: string;
  journal?: string;
  artworkType?: string;

  manualPolicyConfirmed?: boolean;

  referenceImages?: ReferenceImage[];

  scientificConstraints?: string[];
  avoid?: string[];

  preserveScientificContent?: boolean;
  removeUnverifiedElements?: boolean;

  direction?:
    | "balanced"
    | "more-scientific"
    | "more-artistic";

  changeComposition?: boolean;
  changeLighting?: boolean;

  customInstruction?: string;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as RefineArtworkRequest;

    const {
      currentImage,

      publisher = "",
      journal = "",
      artworkType = "",

      manualPolicyConfirmed = false,

      referenceImages = [],

      scientificConstraints = [],
      avoid = [],

      preserveScientificContent = true,
      removeUnverifiedElements = true,

      direction = "balanced",

      changeComposition = false,
      changeLighting = false,

      customInstruction = "",
    } = body;

    /*
     * Basic validation
     */

    if (!currentImage) {
      return NextResponse.json(
        {
          error:
            "Current artwork is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!artworkType.trim()) {
      return NextResponse.json(
        {
          error:
            "Publication artwork type is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * AI policy enforcement
     *
     * Refinement is a separate AI operation,
     * so policy enforcement must happen again.
     */

    const policyDecision =
      enforceAiOperation({
        publisher,
        journal,
        artworkType,

        aiUseType:
          "generative-refinement",

        manualPolicyConfirmed,
      });

    if (!policyDecision.allowed) {
      return NextResponse.json(
        {
          error:
            policyDecision.message,

          code:
            policyDecision.status ===
            "not-allowed"
              ? "AI_POLICY_NOT_ALLOWED"
              : "AI_POLICY_MANUAL_CHECK_REQUIRED",

          policy: {
            status:
              policyDecision.status,

            aiUseType:
              policyDecision.aiUseType,

            message:
              policyDecision.message,

            disclosureRequired:
              policyDecision.disclosureRequired,

            disclosureInstructions:
              policyDecision.disclosureInstructions,

            conditions:
              policyDecision.conditions,
          },
        },
        {
          status:
            policyDecision.status ===
            "not-allowed"
              ? 403
              : 409,
        }
      );
    }

    /*
     * Refinement direction
     */

    const directionInstruction =
      direction === "more-scientific"
        ? `
Make the artwork more scientifically literal.

Reduce unnecessary metaphorical or decorative
scientific-looking content.

Favor recognizable, plausible scientific forms
and relationships.
`
        : direction === "more-artistic"
          ? `
Increase artistic sophistication, atmosphere
and visual impact, but do not violate or weaken
any scientific constraints.
`
          : `
Maintain the current balance between scientific
realism and professional publication presentation.
`;

    /*
     * Product-specific refinement mode
     */

    const isGraphicalAbstract =
      artworkType ===
      "Graphical Abstract";

    const publicationModeInstruction =
      isGraphicalAbstract
        ? `
GRAPHICAL ABSTRACT REFINEMENT

The current image is a graphical abstract.

Preserve:

- its scientific communication function,
- its reading direction,
- meaningful spatial relationships,
- separation between scientific components,
- scientific hierarchy.

Do not convert it into:

- journal-cover artwork,
- cinematic concept art,
- a decorative scientific landscape,
- an advertising image.

Do not invent arrows, mechanisms, pathways,
transformations, labels or causal relationships.

If composition changes are requested, improve
scientific communication rather than visual drama.

Do not generate typography.
`
        : `
JOURNAL COVER REFINEMENT

The current image is journal-cover artwork.

Preserve:

- the primary focal subject,
- editorial visual hierarchy,
- scientific identity,
- useful negative space,
- publication-cover character.

Do not convert it into:

- a graphical abstract,
- infographic,
- flowchart,
- scientific figure,
- panel-based diagram.

Do not generate journal branding, mastheads,
article titles or other typography.
`;

    /*
     * Refinement prompt
     */

    const prompt = `
Edit the FIRST supplied image, which is the current
scientific publication artwork.

The remaining supplied images, if any, are
researcher-provided scientific reference assets.

IMPORTANT:

This is an EDIT of the existing artwork,
not a completely new design.


PUBLICATION CONTEXT

Publisher:
${publisher || "Not specified"}

Journal:
${journal || "Not specified"}

Artwork type:
${artworkType}


${publicationModeInstruction}


SCIENTIFIC PRIORITY

${
  preserveScientificContent
    ? `
Preserve the scientifically meaningful content,
recognizable subject, important geometry,
relationships and overall scientific identity
of the current artwork.
`
    : `
Scientific content may be visually reorganized
when necessary, but it must remain scientifically
plausible and faithful to the supplied research.
`
}


SCIENTIFIC CONSTRAINTS

${
  scientificConstraints.length
    ? scientificConstraints
        .map(
          (item) =>
            `- ${item}`
        )
        .join("\n")
    : "- Do not invent unsupported scientific findings or mechanisms."
}


ELEMENTS TO AVOID

${
  avoid.length
    ? avoid
        .map(
          (item) =>
            `- ${item}`
        )
        .join("\n")
    : "- Unsupported scientific content."
}


${
  removeUnverifiedElements
    ? `
REMOVE UNVERIFIED SCIENTIFIC-LOOKING CONTENT

Remove or simplify decorative:

- chemical formulas,
- molecular structures,
- equations,
- arrows,
- interaction diagrams,
- scientific symbols,
- scientific-looking objects

that are not clearly supported by the supplied
scientific content.

Do not replace them with different invented
scientific symbols.

Use neutral visual texture, lighting, material
detail or negative space instead.
`
    : ""
}


VISUAL DIRECTION

${directionInstruction}


COMPOSITION

${
  changeComposition
    ? `
You may improve the composition and reposition
visual elements while preserving the core subject
and scientific meaning.

Maintain the artwork's publication-specific
orientation and aspect-ratio strategy.

${
  isGraphicalAbstract
    ? `
Preserve or improve the scientific reading path
and separation of major scientific components.
`
    : `
Preserve journal-cover hierarchy and useful
negative space for later publisher branding.
`
}
`
    : `
Preserve the current overall composition,
camera perspective, visual hierarchy and
principal object placement as closely as possible.
`
}


LIGHTING AND COLOR

${
  changeLighting
    ? `
You may improve lighting, contrast, atmosphere
and color harmony while preserving scientific
readability and scientific identity.
`
    : `
Keep the existing overall lighting and color
direction unless a subtle adjustment is required
for visual coherence.
`
}


RESEARCHER'S CUSTOM REFINEMENT

${
  customInstruction.trim() ||
  "No additional refinement instruction."
}


REFERENCE-ASSET RULES

- The FIRST image is the artwork that must be edited.
- Any additional images are scientific reference assets.
- Use reference assets to preserve recognizable scientific form.
- Do not transform a researcher-supplied molecular structure,
  morphology or scientific object into an invented replacement.
- Preserve scientifically meaningful geometry.
- Preserve scientifically meaningful topology.
- Preserve meaningful relative relationships.
- Do not fabricate experimental evidence.
- Do not invent scientific mechanisms.
- Do not add journal logos.
- Do not add article titles.
- Do not add author names.
- Do not add fake labels.
- Do not add fake axes.
- Do not add decorative scientific typography.

The result must remain recognizably the same scientific
artwork unless the researcher explicitly requested a
composition change.
`;

    /*
     * Build image request.
     *
     * First image = artwork being edited.
     * Remaining images = scientific references.
     */

    const images = [
      {
        image_url:
          currentImage,
      },

      ...referenceImages
        .slice(0, 3)
        .filter(
          (image) =>
            Boolean(
              image?.dataUrl
            )
        )
        .map(
          (image) => ({
            image_url:
              image.dataUrl,
          })
        ),
    ];

    /*
     * Send edit request.
     */

    const apiResponse =
      await fetch(
        "https://api.openai.com/v1/images/edits",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              model:
                "gpt-image-2",

              images,

              prompt,

              size:
                isGraphicalAbstract
                  ? "1536x1024"
                  : "1024x1536",

              quality:
                "medium",

              output_format:
                "png",

              n:
                1,
            }),
        }
      );

    const data =
      await apiResponse.json();

    if (!apiResponse.ok) {
      console.error(
        "OpenAI image edit error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Failed to refine artwork.",
        },
        {
          status:
            apiResponse.status,
        }
      );
    }

    const base64 =
      data?.data?.[0]?.b64_json;

    if (!base64) {
      return NextResponse.json(
        {
          error:
            "No refined image was returned.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      image:
        `data:image/png;base64,${base64}`,

      policy: {
        status:
          policyDecision.status,

        aiUseType:
          policyDecision.aiUseType,

        disclosureRequired:
          policyDecision.disclosureRequired,

        disclosureInstructions:
          policyDecision.disclosureInstructions,

        conditions:
          policyDecision.conditions,

        manualPolicyConfirmed,
      },
    });
  } catch (error) {
    console.error(
      "Artwork refinement error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to refine artwork.",
      },
      {
        status: 500,
      }
    );
  }
}