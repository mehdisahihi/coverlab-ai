import { NextResponse } from "next/server";

import {
  createOpenAiClientRequestId,
  getOpenAiClient,
  logOpenAiSdkError,
  openAiImageRequestOptions,
} from "@/lib/openai/client";
import {
  getArtworkGeometry,
} from "../../../lib/artworkGeometry";
import {
  enforceAiOperation,
} from "../../../lib/publications/enforcement";

type ReferenceImage = {
  name: string;
  dataUrl: string;
};

type GenerateArtworkRequest = {
  imageGenerationInstruction: string;

  scientificConstraints?: string[];
  avoid?: string[];

  referenceImages?: ReferenceImage[];

  preserveAssets?: boolean;
  assetNotes?: string;

  artworkType?: string;
  publisher?: string;
  journal?: string;

  /*
   * True only after the researcher has explicitly
   * acknowledged a manual-verification requirement.
   */
  manualPolicyConfirmed?: boolean;
};

export async function POST(
  request: Request
) {
  const clientRequestId =
    createOpenAiClientRequestId();

  try {
    const body =
      (await request.json()) as GenerateArtworkRequest;

    const {
      imageGenerationInstruction,

      scientificConstraints = [],
      avoid = [],

      referenceImages = [],

      preserveAssets = false,
      assetNotes = "",

      artworkType = "",
      publisher = "",
      journal = "",

      manualPolicyConfirmed = false,
    } = body;

    if (
      !imageGenerationInstruction ||
      !imageGenerationInstruction.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Image generation instruction is required.",
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

    const policyDecision =
      enforceAiOperation({
        publisher,
        journal,
        artworkType,
        aiUseType:
          "generative-creation",
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

    const geometry =
      getArtworkGeometry(
        artworkType
      );

    const isGraphicalAbstract =
      artworkType ===
      "Graphical Abstract";

    const artworkModeInstruction =
      isGraphicalAbstract
        ? `
GRAPHICAL ABSTRACT MODE

Create a GRAPHICAL ABSTRACT whose primary purpose
is scientific communication.

The image must prioritize:

- immediate understanding of the central scientific message,
- clear hierarchy between scientific elements,
- an obvious and coherent reading direction,
- restrained visual complexity,
- scientifically meaningful spatial relationships,
- clean separation of major components,
- efficient use of available space.

Suitable organizational structures may include:

- left-to-right scientific progression,
- top-to-bottom progression,
- input-process-output organization,
- central-process organization,
- comparison organization,
- before/after organization,

but ONLY when those relationships are explicitly supported
by the supplied research and production brief.


SCIENTIFIC RELATIONSHIPS

Do not invent:

- arrows,
- causal pathways,
- mechanisms,
- transformations,
- molecular interactions,
- process stages,
- equations,
- formulas,
- numeric values,
- unsupported labels,
- unsupported annotations.

An arrow, pathway, transition or spatial relationship must
not imply a scientific claim that is absent from the research.


VISUAL CHARACTER

Do not turn the graphical abstract into:

- cinematic concept art,
- journal-cover artwork,
- an advertising poster,
- a decorative scientific landscape,
- an unnecessarily photorealistic scene.

Use artistic polish only where it improves:

- scientific comprehension,
- visual hierarchy,
- separation of elements,
- professional presentation.


TYPOGRAPHY FOR GRAPHICAL ABSTRACTS

Do not generate text or labels directly into the image.

If the production brief refers to text, labels or annotations,
reserve clean visual space where accurate researcher-provided
typography may later be added.

The graphical abstract should communicate as much as possible
through scientifically meaningful imagery and organization
without relying on generated typography.
`
        : `
JOURNAL COVER MODE

Create premium JOURNAL COVER artwork.

The primary purpose is scientifically responsible,
editorially compelling visual storytelling.

Prioritize:

- one memorable focal subject,
- sophisticated visual hierarchy,
- premium editorial composition,
- depth and dimensionality,
- scientifically appropriate materials and surfaces,
- controlled atmosphere,
- expressive but scientifically responsible lighting,
- visual impact at journal-cover scale,
- useful negative space for later journal branding.


VISUAL CHARACTER

The result should feel like polished scientific editorial
artwork rather than:

- a graphical abstract,
- a data figure,
- an infographic,
- a flowchart,
- a schematic diagram.

Avoid:

- panel-based layouts,
- dense explanatory structures,
- unnecessary arrows,
- infographic-style iconography,
- excessive scientific annotation,
- generated text,
- article titles,
- journal branding.


MASTHEAD AWARENESS

Keep important scientific content away from regions
likely to be occupied later by the journal masthead.

Do not generate the masthead itself.

The final artwork should read as one unified,
visually powerful scientific scene.
`;

    const prompt = `
Create one professional scientific publication artwork.


${artworkModeInstruction}


PUBLICATION CONTEXT

Publisher:
${publisher || "Not specified"}

Journal:
${journal || "Not specified"}

Artwork type:
${artworkType}

Canvas orientation:
${geometry.orientation}

Target composition:
${geometry.label}

Approximate final target aspect ratio:
${geometry.targetAspectRatio}:1


ARTWORK-TYPE GEOMETRY

${geometry.compositionInstruction}


PRIMARY PRODUCTION INSTRUCTION

${imageGenerationInstruction}


MANDATORY SCIENTIFIC CONSTRAINTS

${
  scientificConstraints.length
    ? scientificConstraints
        .map(
          (item) =>
            `- ${item}`
        )
        .join("\n")
    : "- Preserve scientific plausibility."
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


SCIENTIFIC REFERENCE ASSETS

${
  referenceImages.length
    ? `You have ${referenceImages.length} researcher-supplied scientific reference image(s).`
    : "No researcher-supplied image references were provided."
}


${
  preserveAssets &&
  referenceImages.length
    ? `
IMPORTANT: PRESERVE SCIENTIFIC ASSETS

Treat supplied reference images as scientific source material.

- Preserve recognizable scientific subjects.
- Preserve important geometry.
- Preserve morphology and topology when scientifically meaningful.
- Preserve scientifically meaningful relative structures.
- Do not replace supplied scientific structures with invented alternatives.
- Do not distort supplied scientific structures merely for visual drama.
- Build the surrounding visual treatment around the scientific source material.

${
  isGraphicalAbstract
    ? `
For graphical abstracts, preservation takes priority over
decorative reinterpretation.

Use the supplied scientific assets as communication elements
within a clear scientific hierarchy.
`
    : `
For journal covers, artistic lighting, atmosphere and surrounding
visual design may be developed around the preserved scientific
source material.
`
}
`
    : referenceImages.length
      ? `
Use supplied scientific images as references for subject,
form and scientific context.

Artistic reinterpretation is allowed only where it does
not alter scientific meaning.
`
      : ""
}


RESEARCHER'S ASSET INSTRUCTIONS

${assetNotes || "None"}


GLOBAL SCIENTIFIC ART RULES

- Never invent research findings.
- Never invent molecular mechanisms.
- Never invent chemical structures or formulas merely as decoration.
- Never add meaningless scientific symbols.
- Never imply unsupported causal relationships.
- Never fabricate experimental evidence.
- Artistic metaphors must remain distinguishable from scientific facts.
- Preserve scientific recognizability.
- Favor visual clarity over decorative complexity.


GLOBAL TYPOGRAPHY RULES

Do not add:

- journal mastheads,
- journal logos,
- article titles,
- author names,
- captions,
- decorative equations,
- fake labels,
- fake axes,
- decorative scientific typography.

Any typography required for the final publication should be
added later using accurate researcher- or publisher-provided text.


FINAL COMPOSITION REQUIREMENT

The artwork must be composed from the beginning for a
${geometry.orientation} ${geometry.label}.

Do NOT create a generic image that would require extreme
cropping later.

All essential scientific content must remain inside a crop-safe
region appropriate for a final aspect ratio of approximately
${geometry.targetAspectRatio}:1.


${
  isGraphicalAbstract
    ? `
GRAPHICAL ABSTRACT FINAL COMPOSITION

- Preserve a clear reading path.
- Keep major scientific elements visually distinct.
- Make the central scientific message understandable quickly.
- Avoid burying scientific relationships inside decorative detail.
- Avoid unnecessary atmospheric background complexity.
- Avoid cover-style cinematic staging.
- Preserve clean separation between scientifically distinct elements.
- Reserve clean space where accurate labels could later be added
  outside the generated artwork if needed.
- Do not place essential scientific elements so close to an edge
  that normal publication cropping could remove them.
`
    : `
JOURNAL COVER FINAL COMPOSITION

- Preserve a strong central or deliberately positioned focal subject.
- Maintain useful negative space for later masthead placement.
- Avoid putting critical scientific content at vulnerable crop edges.
- Favor one coherent editorial composition over multiple panels.
- Preserve visual impact when viewed at reduced cover size.
- Use atmosphere and depth without obscuring scientific identity.
`
}
`;

    const content: Array<
      | {
          type: "input_text";
          text: string;
        }
      | {
          type: "input_image";
          image_url: string;
          detail: "auto";
        }
    > = [
      {
        type: "input_text",
        text: prompt,
      },
    ];

    for (
      const image of
      referenceImages.slice(0, 3)
    ) {
      if (!image?.dataUrl) {
        continue;
      }

      content.push({
        type: "input_image",
        image_url:
          image.dataUrl,
        detail:
          "auto",
      });
    }

    const openai =
      getOpenAiClient();

    const response =
      await openai.responses.create(
        {
          model:
            "gpt-5.6",
          store: false,

          input: [
            {
              role:
                "user",
              content,
            },
          ],

          tools: [
            {
              type:
                "image_generation",
              quality:
                "medium",
              size:
                geometry.generationSize,
            },
          ],
        },
        openAiImageRequestOptions(
          clientRequestId
        )
      );

    const imageCall =
      response.output.find(
        (item) =>
          item.type ===
          "image_generation_call"
      );

    if (
      !imageCall ||
      imageCall.type !==
        "image_generation_call" ||
      !imageCall.result
    ) {
      return NextResponse.json(
        {
          error:
            "No image was returned by the image-generation tool.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      image:
        `data:image/png;base64,${imageCall.result}`,
      responseId:
        response.id,
      geometry: {
        key:
          geometry.key,
        label:
          geometry.label,
        generationSize:
          geometry.generationSize,
        orientation:
          geometry.orientation,
        targetAspectRatio:
          geometry.targetAspectRatio,
      },
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
    logOpenAiSdkError(
      "Artwork generation OpenAI error:",
      error,
      clientRequestId
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate artwork.",
      },
      {
        status: 502,
      }
    );
  }
}
