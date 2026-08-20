import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function roundUpToMultipleOf16(
  value: number
) {
  return (
    Math.ceil(value / 16) * 16
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      croppedImage,

      targetWidth,
      targetHeight,

      scientificConstraints = [],
      avoid = [],

      artworkType = "",
      publisher = "",
      journal = "",
    }: {
      croppedImage: string;

      targetWidth: number;
      targetHeight: number;

      scientificConstraints?: string[];
      avoid?: string[];

      artworkType?: string;
      publisher?: string;
      journal?: string;
    } = body;

    if (!croppedImage) {
      return Response.json(
        {
          error:
            "Cropped artwork is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !targetWidth ||
      !targetHeight
    ) {
      return Response.json(
        {
          error:
            "Target publication dimensions are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      The image tool requires compatible
      dimensions.

      The journal dimensions remain the
      FINAL target.

      Example:
      2457 × 3000
           ↓
      2464 × 3008 intermediate AI canvas
    */

    const enhancementWidth =
      roundUpToMultipleOf16(
        targetWidth
      );

    const enhancementHeight =
      roundUpToMultipleOf16(
        targetHeight
      );

    const prompt = `
Perform a HIGH-FIDELITY detail enhancement of the supplied
scientific publication artwork.

THIS IS NOT A REDESIGN.

The supplied image has already been:

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
${artworkType || "Not specified"}

Exact journal target:
${targetWidth} × ${targetHeight} pixels

Intermediate AI enhancement canvas:
${enhancementWidth} × ${enhancementHeight} pixels


PRIMARY OBJECTIVE

Create a carefully reconstructed,
higher-detail version of the SAME artwork.

Preserve the scientific meaning,
composition and visual identity as faithfully
as possible.


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
- scientific relationships,
- lighting direction,
- color direction,
- negative space.


DO NOT

- redesign the artwork,
- invent new molecules,
- invent chemical structures,
- invent chemical formulas,
- invent equations,
- invent arrows,
- invent scientific mechanisms,
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
    : "- Preserve the scientific content already present."
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

Avoid aggressive sharpening and sharpening halos.

The result must look like the same artwork rendered
more carefully at higher detail.

Return one image only.
`;

    const response =
      await openai.responses.create({
        model:
          "gpt-5.6",

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
      });

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
      console.error(
        "No image-generation result:",
        response.output
      );

      return Response.json(
        {
          error:
            response.output_text ||
            "No enhanced image was returned.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      OpenAI returns the generated image as
      base64.

      DO NOT wrap this large base64 string
      inside JSON.

      Convert it to raw PNG bytes and send
      the binary image directly.
    */

    const imageBuffer =
      Buffer.from(
        imageCall.result,
        "base64"
      );

    console.log(
      "Enhanced artwork generated:",
      {
        exactTarget:
          `${targetWidth}x${targetHeight}`,

        enhancementCanvas:
          `${enhancementWidth}x${enhancementHeight}`,

        bytes:
          imageBuffer.length,
      }
    );

    return new Response(
      imageBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "image/png",

          "Content-Length":
            imageBuffer.length.toString(),

          "Cache-Control":
            "no-store",

          "X-CoverLab-Target-Width":
            targetWidth.toString(),

          "X-CoverLab-Target-Height":
            targetHeight.toString(),

          "X-CoverLab-Enhancement-Width":
            enhancementWidth.toString(),

          "X-CoverLab-Enhancement-Height":
            enhancementHeight.toString(),
        },
      }
    );
  } catch (error) {
    console.error(
      "Publication enhancement error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to enhance publication artwork.",
      },
      {
        status: 500,
      }
    );
  }
}