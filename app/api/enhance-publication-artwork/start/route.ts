import {
  enforceAiOperation,
} from "../../../../lib/publications/enforcement";

function roundUpToMultipleOf16(
  value: number
) {
  return (
    Math.ceil(
      value / 16
    ) * 16
  );
}

type EnhancementRequest = {
  croppedImage: string;

  targetWidth: number;
  targetHeight: number;

  scientificConstraints?: string[];
  avoid?: string[];

  artworkType?: string;
  publisher?: string;
  journal?: string;

  manualPolicyConfirmed?: boolean;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as EnhancementRequest;

    const {
      croppedImage,

      targetWidth,
      targetHeight,

      scientificConstraints = [],
      avoid = [],

      artworkType = "",
      publisher = "",
      journal = "",

      manualPolicyConfirmed = false,
    } = body;

    /*
     * Basic validation must happen before
     * starting an expensive background job.
     */

    if (
      !process.env.OPENAI_API_KEY
    ) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (!croppedImage) {
      return Response.json(
        {
          error:
            "Approved cropped artwork is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        targetWidth
      ) ||
      !Number.isFinite(
        targetHeight
      ) ||
      targetWidth <= 0 ||
      targetHeight <= 0
    ) {
      return Response.json(
        {
          error:
            "Valid target publication dimensions are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!artworkType.trim()) {
      return Response.json(
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
     * Detail enhancement is independently
     * policy-gated because it is another
     * AI image operation.
     */

    const policyDecision =
      enforceAiOperation({
        publisher,
        journal,
        artworkType,

        aiUseType:
          "detail-enhancement",

        manualPolicyConfirmed,
      });

    if (!policyDecision.allowed) {
      return Response.json(
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
     * Image-generation dimensions must be
     * compatible with the image tool.
     *
     * We enhance on the nearest larger
     * multiple-of-16 canvas.
     */

    const enhancementWidth =
      roundUpToMultipleOf16(
        targetWidth
      );

    const enhancementHeight =
      roundUpToMultipleOf16(
        targetHeight
      );

    const isGraphicalAbstract =
      artworkType ===
      "Graphical Abstract";

    /*
     * Product-specific preservation rules.
     */

    const publicationModeInstruction =
      isGraphicalAbstract
        ? `
GRAPHICAL ABSTRACT PRESERVATION

This artwork is an approved graphical abstract.

Preserve:

- scientific reading direction,
- scientific hierarchy,
- relative placement of major components,
- meaningful spatial relationships,
- scientific communication structure,
- clear separation between distinct scientific elements.

Do not introduce:

- new arrows,
- new pathways,
- new mechanisms,
- new transformations,
- new labels,
- new annotations,
- new scientific relationships.

Do not transform the graphical abstract into
journal-cover artwork or cinematic concept art.
`
        : `
JOURNAL COVER PRESERVATION

This artwork is approved journal-cover artwork.

Preserve:

- focal hierarchy,
- primary scientific subject,
- editorial composition,
- depth,
- negative space,
- masthead-safe composition,
- overall cover identity.

Do not transform the artwork into:

- a graphical abstract,
- infographic,
- flowchart,
- schematic figure,
- panel-based scientific diagram.
`;

    const prompt = `
Perform a HIGH-FIDELITY detail enhancement of the supplied
scientific publication artwork.

THIS IS NOT A REDESIGN.

The supplied artwork has already been:

- scientifically reviewed,
- compositionally selected,
- cropped by the researcher,
- approved for publication framing.


TARGET PUBLICATION

Publisher:
${publisher || "Not specified"}

Journal:
${journal || "Not specified"}

Artwork type:
${artworkType}

Exact publication target:
${targetWidth} × ${targetHeight} pixels

Intermediate enhancement canvas:
${enhancementWidth} × ${enhancementHeight} pixels


${publicationModeInstruction}


PRIMARY OBJECTIVE

Create a carefully reconstructed,
higher-detail version of the SAME artwork.

Preserve the scientific meaning,
composition, geometry and visual identity
as faithfully as possible.


STRICT PRESERVATION RULES

Preserve:

- overall composition,
- approved crop framing,
- camera viewpoint,
- focal subject,
- scientific object identity,
- molecular or material geometry,
- morphology,
- topology,
- relative object positions,
- relative scale,
- scientifically meaningful relationships,
- lighting direction,
- color direction,
- negative space.


DO NOT

- redesign the artwork,
- invent molecules,
- invent chemical structures,
- invent chemical formulas,
- invent equations,
- invent arrows,
- invent mechanisms,
- invent molecular interactions,
- invent experimental features,
- add labels,
- add text,
- add journal logos,
- add mastheads,
- add article titles,
- change scientific identity,
- change meaningful geometry,
- relocate important scientific elements.


SCIENTIFIC CONSTRAINTS

${
  scientificConstraints.length
    ? scientificConstraints
        .map(
          (item) =>
            `- ${item}`
        )
        .join("\n")
    : "- Preserve all scientifically meaningful content already present."
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
    : "- Unsupported scientific decoration."
}


QUALITY ENHANCEMENT ONLY

Where appropriate, improve:

- edge definition,
- smooth gradients,
- material rendering,
- physically plausible texture,
- subtle surface detail,
- local contrast,
- anti-aliasing,
- visual coherence at high resolution.

Do not add fake microscopic or molecular detail
that could be interpreted as experimental evidence.

Avoid aggressive sharpening.

Avoid sharpening halos.

Do not introduce new scientifically meaningful
structures while reconstructing fine detail.

The output must look like the same artwork rendered
with greater visual fidelity, not like a newly
designed image.

Return one image only.
`;

    /*
     * Start OpenAI background enhancement.
     */

    const openaiResponse =
      await fetch(
        "https://api.openai.com/v1/responses",
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
                "gpt-5.6",

              background:
                true,

              input: [
                {
                  role:
                    "user",

                  content: [
                    {
                      type:
                        "input_text",

                      text:
                        prompt,
                    },

                    {
                      type:
                        "input_image",

                      image_url:
                        croppedImage,

                      detail:
                        "auto",
                    },
                  ],
                },
              ],

              tools: [
                {
                  type:
                    "image_generation",

                  quality:
                    "high",

                  size:
                    `${enhancementWidth}x${enhancementHeight}`,
                },
              ],
            }),
        }
      );

    const rawText =
      await openaiResponse.text();

    let data: any;

    try {
      data =
        rawText
          ? JSON.parse(
              rawText
            )
          : null;
    } catch {
      return Response.json(
        {
          error:
            `OpenAI returned an invalid response while starting enhancement. HTTP ${openaiResponse.status}.`,
        },
        {
          status: 502,
        }
      );
    }

    if (!openaiResponse.ok) {
      return Response.json(
        {
          error:
            data?.error?.message ||
            `OpenAI failed to start the enhancement job. HTTP ${openaiResponse.status}.`,
        },
        {
          status:
            openaiResponse.status,
        }
      );
    }

    if (!data?.id) {
      return Response.json(
        {
          error:
            "OpenAI did not return a background response ID.",
        },
        {
          status: 502,
        }
      );
    }

    console.log(
      "Enhancement background job started:",
      {
        responseId:
          data.id,

        status:
          data.status,

        exactTarget:
          `${targetWidth}x${targetHeight}`,

        enhancementCanvas:
          `${enhancementWidth}x${enhancementHeight}`,

        artworkType,

        policyStatus:
          policyDecision.status,

        manualPolicyConfirmed,
      }
    );

    return Response.json({
      responseId:
        data.id,

      status:
        data.status,

      targetWidth,

      targetHeight,

      enhancementWidth,

      enhancementHeight,

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
      "Start enhancement error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start publication enhancement.",
      },
      {
        status: 500,
      }
    );
  }
} 