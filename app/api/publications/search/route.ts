import {
  searchPublications,
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

    const query =
      url.searchParams.get(
        "q"
      ) ?? "";

    const publisherId =
      cleanOptional(
        url.searchParams.get(
          "publisherId"
        )
      );

    const discipline =
      cleanOptional(
        url.searchParams.get(
          "discipline"
        )
      );

    const rawLimit =
      url.searchParams.get(
        "limit"
      );

    const limit =
      clampLimit(
        rawLimit
      );

    const results =
      searchPublications(
        query,
        {
          publisherId,

          discipline,

          limit,
        }
      );

    return Response.json(
      {
        query,

        filters: {
          publisherId:
            publisherId ??
            null,

          discipline:
            discipline ??
            null,
        },

        count:
          results.length,

        results,
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
      "Publication search error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to search publications.",
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

function clampLimit(
  value: string | null
) {
  if (!value) {
    return 20;
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return 20;
  }

  return Math.max(
    1,
    Math.min(
      50,
      Math.round(
        parsed
      )
    )
  );
}