import type {
  ArtworkKind,
  ArtworkTypeDefinition,
} from "./types";

export const ARTWORK_TYPES: ArtworkTypeDefinition[] = [
  {
    kind: "Supplementary Cover",
    aliases: [
      "supplementary cover",
      "supplementary front cover",
      "supplemental cover",
      "supplemental front cover",
    ],
    description:
      "Additional cover artwork associated with a journal issue or publication.",
  },

  {
    kind: "Inside Cover",
    aliases: [
      "inside cover",
      "inside front cover",
      "inside back cover",
    ],
    description:
      "Artwork intended for an inside-cover placement.",
  },

  {
    kind: "Back Cover",
    aliases: [
      "back cover",
      "rear cover",
    ],
    description:
      "Artwork intended for the back cover of a publication.",
  },

  {
    kind: "Front Cover",
    aliases: [
      "front cover",
      "journal cover",
      "cover artwork",
      "cover art",
      "cover image",
    ],
    description:
      "Primary publication cover artwork.",
  },

  {
    kind: "Graphical Abstract",
    aliases: [
      "graphical abstract",
      "graphic abstract",
      "abstract graphic",
      "graphical summary",
    ],
    description:
      "A visual summary of the main findings or message of an article.",
  },

  {
    kind: "TOC Graphic",
    aliases: [
      "toc graphic",
      "toc image",
      "toc artwork",
      "table of contents graphic",
      "table-of-contents graphic",
      "table of contents image",
      "table-of-contents image",
    ],
    description:
      "Artwork used in a table-of-contents or contents listing context.",
  },

  {
    kind: "Highlights Graphic",
    aliases: [
      "highlights graphic",
      "highlight graphic",
      "highlights image",
      "highlight image",
    ],
    description:
      "A compact visual highlighting key results or messages.",
  },

  {
    kind: "Visual Abstract",
    aliases: [
      "visual abstract",
      "visual summary",
    ],
    description:
      "A structured visual summary of a study, often used in medical or multidisciplinary publishing.",
  },

  {
    kind: "Article Thumbnail",
    aliases: [
      "article thumbnail",
      "thumbnail",
      "article image",
      "listing thumbnail",
    ],
    description:
      "A compact publication image used in article listings, landing pages, or promotional contexts.",
  },

  {
    kind: "Scheme",
    aliases: [
      "scheme",
      "reaction scheme",
      "synthetic scheme",
      "process scheme",
    ],
    description:
      "A scientific scheme, including reaction, synthetic, or process representations.",
  },

  {
    kind: "Infographic",
    aliases: [
      "infographic",
      "scientific infographic",
    ],
    description:
      "A structured visual presentation combining scientific information and explanatory graphics.",
  },

  {
    kind: "Conceptual Illustration",
    aliases: [
      "conceptual illustration",
      "scientific illustration",
      "concept illustration",
      "conceptual figure",
      "illustration",
    ],
    description:
      "A non-data-derived conceptual scientific illustration.",
  },

  {
    kind: "Figure",
    aliases: [
      "figure",
      "scientific figure",
      "research figure",
      "article figure",
    ],
    description:
      "A figure used within a scientific manuscript or publication.",
  },

  {
    kind: "Other",
    aliases: [
      "other",
      "custom",
      "custom artwork",
      "other artwork",
    ],
    description:
      "A publication artwork type not covered by the current canonical taxonomy.",
  },
];

export function normalizePublicationText(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(
      /[_\-‐-‒–—―−]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}

export function normalizeArtworkTypeV2(
  value: string
): ArtworkKind {
  const normalized =
    normalizePublicationText(
      value
    );

  /*
   * Exact alias match first.
   *
   * This avoids accidental collisions such as:
   *
   * "supplementary front cover"
   *
   * being classified as:
   *
   * "Front Cover"
   */

  for (
    const definition of
    ARTWORK_TYPES
  ) {
    for (
      const alias of
      definition.aliases
    ) {
      if (
        normalizePublicationText(
          alias
        ) === normalized
      ) {
        return definition.kind;
      }
    }
  }

  /*
   * Then perform controlled partial matching.
   *
   * ARTWORK_TYPES is deliberately ordered
   * from more specific to more general.
   */

  for (
    const definition of
    ARTWORK_TYPES
  ) {
    if (
      definition.kind ===
      "Other"
    ) {
      continue;
    }

    for (
      const alias of
      definition.aliases
    ) {
      const normalizedAlias =
        normalizePublicationText(
          alias
        );

      if (
        normalized.includes(
          normalizedAlias
        )
      ) {
        return definition.kind;
      }
    }
  }

  return "Other";
}

export function getArtworkTypeDefinition(
  kind: ArtworkKind
): ArtworkTypeDefinition | null {
  return (
    ARTWORK_TYPES.find(
      (definition) =>
        definition.kind ===
        kind
    ) ?? null
  );
}

export function getArtworkTypeAliases(
  kind: ArtworkKind
) {
  return (
    getArtworkTypeDefinition(
      kind
    )?.aliases ?? []
  );
}