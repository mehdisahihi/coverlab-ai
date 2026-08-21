import {
  getPublicationSourcesByIds,
  resolvePublicationTarget,
  resolvePublicationTargetByIds,
} from "../../../../lib/publications";

export const runtime =
  "nodejs";

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const publisherId =
      cleanOptional(
        url.searchParams.get(
          "publisherId"
        )
      );

    const journalId =
      cleanOptional(
        url.searchParams.get(
          "journalId"
        )
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

    if (!artworkType) {
      return Response.json(
        {
          error:
            "artworkType is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Preferred mode:
     *
     * Stable registry IDs selected from
     * the journal-search UI.
     */

    const resolved =
      publisherId
        ? resolvePublicationTargetByIds(
            publisherId,
            journalId,
            artworkType
          )
        : publisher
          ? resolvePublicationTarget(
              publisher,
              journal ?? "",
              artworkType
            )
          : null;

    if (!resolved) {
      return Response.json(
        {
          error:
            "Provide either publisherId or publisher.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Return provenance sources alongside
     * the resolved rules.
     *
     * This allows the UI to show:
     *
     * - official source
     * - verification date
     * - rule confidence
     *
     * instead of presenting requirements
     * without evidence.
     */

    const sourceIds =
      Array.from(
        new Set([
          ...(
            resolved
              .technicalProfile
              ?.provenance
              .sourceIds ??
            []
          ),

          ...(
            resolved
              .aiPolicy
              ?.provenance
              .sourceIds ??
            []
          ),
        ])
      );

    const sources =
      getPublicationSourcesByIds(
        sourceIds
      );

    return Response.json(
      {
        resolved,

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
      "Publication resolution error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resolve publication requirements.",
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