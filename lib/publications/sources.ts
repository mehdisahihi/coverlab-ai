import type {
  PublicationSource,
} from "./types";

export const PUBLICATION_SOURCES: PublicationSource[] = [
  {
    id:
      "acs-langmuir-author-guidelines",

    kind:
      "official-author-guidelines",

    title:
      "Langmuir Author Guidelines",

    url:
      "https://researcher-resources.acs.org/publish/author_guidelines?coden=langd5",

    publisherId:
      "acs",

    journalId:
      "acs-langmuir",

    accessedOn:
      "2026-08-19",

    notes: [
      "Contains Langmuir cover-art dimensions, accepted file formats, minimum resolution, masthead area, and AI disclosure guidance.",
    ],
  },

  {
    id:
      "elsevier-graphical-abstract-guidelines",

    kind:
      "official-submission-guidelines",

    title:
      "Graphical abstract in Elsevier journals",

    url:
      "https://www.elsevier.com/researcher/author/tools-and-resources/graphical-abstract",

    publisherId:
      "elsevier",

    accessedOn:
      "2026-08-19",

    notes: [
      "Contains standard graphical-abstract size, ratio, resolution, and preferred file formats.",
    ],
  },

  {
    id:
      "elsevier-generative-ai-journals",

    kind:
      "official-ai-policy",

    title:
      "Generative AI policies for journals",

    url:
      "https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals",

    publisherId:
      "elsevier",

    accessedOn:
      "2026-08-19",

    notes: [
      "States that general-purpose generative AI image tools must not be used to create graphical abstracts.",
      "Cover-art use may require prior permission from the journal editor and publisher.",
    ],
  },

  {
    id:
      "rsc-materials-horizons-author-guidelines",

    kind:
      "official-author-guidelines",

    title:
      "Materials Horizons Author Guidelines",

    url:
      "https://www.rsc.org/publishing/publish-with-us/publish-a-journal-article/materials-horizons",

    publisherId:
      "rsc",

    journalId:
      "rsc-materials-horizons",

    accessedOn:
      "2026-08-19",

    notes: [
      "Contains TOC graphic maximum dimensions and minimum TIFF resolution.",
    ],
  },

  {
    id:
      "rsc-journal-materials-chemistry-a-guidelines",

    kind:
      "official-author-guidelines",

    title:
      "Journal of Materials Chemistry A Author Guidelines",

    url:
      "https://www.rsc.org/publishing/publish-with-us/publish-a-journal-article/journal-of-materials-chemistry-a",

    publisherId:
      "rsc",

    journalId:
      "rsc-journal-materials-chemistry-a",

    accessedOn:
      "2026-08-19",

    notes: [
      "Contains TOC graphic requirements and AI licensing conditions.",
    ],
  },

  {
    id:
      "wiley-ai-guidelines",

    kind:
      "official-ai-policy",

    title:
      "Wiley AI Guidelines",

    url:
      "https://www.wiley.com/en-us/publish/book/resources/ai-guidelines/",

    publisherId:
      "wiley",

    accessedOn:
      "2026-08-19",

    notes: [
      "General Wiley guidance permits certain explanatory and conceptual AI-assisted images with verification and disclosure.",
      "Individual Wiley journals or partner societies may impose stricter rules.",
    ],
  },

  {
    id:
      "wiley-febs-author-policies",

    kind:
      "official-ai-policy",

    title:
      "FEBS Press Author Policies",

    url:
      "https://febs.onlinelibrary.wiley.com/hub/author-policies",

    publisherId:
      "wiley",

    accessedOn:
      "2026-08-19",

    notes: [
      "Example of a Wiley journal-family policy that differs by content type.",
      "AI may be permitted for graphical abstracts and covers for illustration/schematic purposes but not for data presentation.",
    ],
  },
];

export function getPublicationSourceById(
  sourceId: string
) {
  return (
    PUBLICATION_SOURCES.find(
      (source) =>
        source.id ===
        sourceId
    ) ?? null
  );
}

export function getPublicationSourcesByIds(
  sourceIds: string[]
) {
  const wanted =
    new Set(
      sourceIds
    );

  return PUBLICATION_SOURCES.filter(
    (source) =>
      wanted.has(
        source.id
      )
  );
}