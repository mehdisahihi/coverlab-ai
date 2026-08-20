import {
  getPublicationSourcesByIds,
  resolvePublicationTarget,
} from "../../../../lib/publications";

import type {
  AiUseType,
} from "../../../../lib/publications";

export const runtime =
  "nodejs";

const VALID_AI_USE_TYPES =
  new Set<AiUseType>([
    "generative-creation",
    "generative-refinement",
    "detail-enhancement",
    "non-generative-editing",
    "unknown",
  ]);

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const publisher =
      cleanOptional(
        url.searchParams.get(
          "publisher"
        )
      );

    const journal =
      cleanOptional(
        url.searchParams.get(
          "journal"
        )
      );

    const artworkType =
      cleanOptional(
        url.searchParams.get(
          "artworkType"
        )
      );

    const rawAiUseType =
      cleanOptional(
        url.searchParams.get(
          "aiUseType"
        )
      );

    if (
      !publisher ||
      !artworkType ||
      !rawAiUseType
    ) {
      return Response.json(
        {
          error:
            "publisher, artworkType and aiUseType are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_AI_USE_TYPES.has(
        rawAiUseType as AiUseType
      )
    ) {
      return Response.json(
        {
          error:
            "Unsupported aiUseType.",
        },
        {
          status: 400,
        }
      );
    }

    const aiUseType =
      rawAiUseType as AiUseType;

    const resolved =
      resolvePublicationTarget(
        publisher,
        journal ?? "",
        artworkType
      );

    const policy =
      resolved.aiPolicy;

    if (
      !policy ||
      resolved.requiresManualPolicyCheck ||
      !(
        policy.aiUseTypes.includes(
          aiUseType
        ) ||
        policy.aiUseTypes.includes(
          "unknown"
        )
      )
    ) {
      return Response.json(
        {
          allowed:
            false,

          status:
            "manual-check",

          disclosureRequired:
            false,

          disclosure:
            null,

          message:
            "CoverLab does not have an applicable verified AI policy for this publication and AI operation. Manual verification is required before using generative AI.",

          conditions:
            [],

          provenance:
            null,

          sources:
            [],
        },
        {
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const sources =
      getPublicationSourcesByIds(
        policy.provenance
          .sourceIds
      );

    return Response.json(
      {
        allowed:
          policy.status ===
            "allowed" ||
          policy.status ===
            "conditional",

        status:
          policy.status,

        disclosureRequired:
          policy.disclosure
            .required ===
          true,

        disclosure:
          policy.disclosure,

        message:
          policy.message,

        conditions:
          policy.conditions ??
          [],

        provenance:
          policy.provenance,

        sources,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Publication policy resolution error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resolve publication AI policy.",
      },
      {
        status: 500,
      }
    );
  }
}

function cleanOptional(
  value: string | null
) {
  if (!value) {
    return undefined;
  }

  const cleaned =
    value.trim();

  return cleaned
    ? cleaned
    : undefined;
}
