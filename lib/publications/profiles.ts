import type {
  PublicationTechnicalProfile,
} from "./types";

export const PUBLICATION_PROFILES: PublicationTechnicalProfile[] = [
  {
    id:
      "acs-langmuir-front-cover-v1",

    publisherId:
      "acs",

    journalId:
      "acs-langmuir",

    artworkType:
      "Front Cover",

    artworkAliases: [
      "journal cover",
      "cover art",
      "front cover art",
    ],

    dimensions: {
      mode:
        "exact",

      widthPx:
        2457,

      heightPx:
        3000,
    },

    physicalDimensions: {
      width:
        8.19,

      height:
        10.0,

      unit:
        "in",
    },

    aspectRatio: {
      width:
        819,

      height:
        1000,

      tolerancePercent:
        0.5,
    },

    resolution: [
      {
        mode:
          "minimum",

        dpi:
          300,

        appliesTo:
          "all",
      },
    ],

    formats: [
      {
        format:
          "TIFF",

        allowed:
          true,

        preferred:
          true,
      },

      {
        format:
          "JPEG",

        allowed:
          true,
      },

      {
        format:
          "PNG",

        allowed:
          true,
      },

      {
        format:
          "EPS",

        allowed:
          true,
      },
    ],

    safeAreas: {
      unit:
        "in",

      mastheadArea: {
        top:
          2.5,
      },

      notes: [
        "The journal title covers the top 2.5 inches of the image.",
      ],
    },

    text: {
      textAllowed:
        false,

      notes: [
        "Colorful images without text or structures are preferred.",
        "The cover image should be artistic and scientifically accurate and should not resemble a graphical abstract or data figure.",
      ],
    },

    notes: [
      "Derived from official Langmuir author guidelines.",
      "Pixel dimensions are the exact conversion of 8.19 × 10.00 inches at 300 dpi.",
    ],

    provenance: {
      sourceIds: [
        "acs-langmuir-author-guidelines",
      ],

      verifiedOn:
        "2026-08-19",

      verificationStatus:
        "verified",

      confidence:
        "verified-journal",
    },

    version: {
      version:
        1,

      active:
        true,

      effectiveFrom:
        "2026-08-19",
    },
  },

  {
    id:
      "elsevier-graphical-abstract-standard-v1",

    publisherId:
      "elsevier",

    artworkType:
      "Graphical Abstract",

    artworkAliases: [
      "graphical abstract",
      "visual abstract",
    ],

    dimensions: {
      mode:
        "minimum",

      minimumWidthPx:
        1328,

      minimumHeightPx:
        531,
    },

    aspectRatio: {
      width:
        500,

      height:
        200,

      tolerancePercent:
        1,
    },

    resolution: [
      {
        mode:
          "minimum",

        dpi:
          300,

        appliesTo:
          "all",
      },
    ],

    formats: [
      {
        format:
          "TIFF",

        allowed:
          true,

        preferred:
          true,
      },

      {
        format:
          "EPS",

        allowed:
          true,

        preferred:
          true,
      },

      {
        format:
          "PDF",

        allowed:
          true,

        preferred:
          true,
      },
    ],

    notes: [
      "Elsevier describes this as a standard guideline; individual journal instructions may override it.",
      "Larger images should preserve approximately the same aspect ratio.",
    ],

    provenance: {
      sourceIds: [
        "elsevier-graphical-abstract-guidelines",
      ],

      verifiedOn:
        "2026-08-19",

      verificationStatus:
        "verified",

      confidence:
        "verified-publisher",
    },

    version: {
      version:
        1,

      active:
        true,

      effectiveFrom:
        "2026-08-19",
    },
  },

  {
    id:
      "rsc-materials-horizons-toc-v1",

    publisherId:
      "rsc",

    journalId:
      "rsc-materials-horizons",

    artworkType:
      "TOC Graphic",

    artworkAliases: [
      "table of contents graphic",
      "graphical abstract",
    ],

    physicalDimensions: {
      width:
        8,

      height:
        4,

      unit:
        "cm",
    },

    dimensions: {
      mode:
        "maximum",

      maximumWidthPx:
        1890,

      maximumHeightPx:
        945,
    },

    aspectRatio: {
      width:
        2,

      height:
        1,

      tolerancePercent:
        1,
    },

    resolution: [
      {
        mode:
          "minimum",

        dpi:
          600,

        appliesTo:
          "all",
      },
    ],

    formats: [
      {
        format:
          "TIFF",

        allowed:
          true,

        preferred:
          true,
      },
    ],

    text: {
      textAllowed:
        true,

      notes: [
        "Text should remain limited and clearly legible.",
      ],
    },

    notes: [
      "Maximum TOC graphic size is 8 cm × 4 cm.",
      "TIFF at 600 dpi or greater is requested.",
    ],

    provenance: {
      sourceIds: [
        "rsc-materials-horizons-author-guidelines",
      ],

      verifiedOn:
        "2026-08-19",

      verificationStatus:
        "verified",

      confidence:
        "verified-journal",
    },

    version: {
      version:
        1,

      active:
        true,

      effectiveFrom:
        "2026-08-19",
    },
  },
];

export function getActivePublicationProfiles() {
  return PUBLICATION_PROFILES.filter(
    (profile) =>
      profile.version.active
  );
}

export function getProfilesByJournalId(
  journalId: string
) {
  return getActivePublicationProfiles().filter(
    (profile) =>
      profile.journalId ===
      journalId
  );
}

export function getProfilesByPublisherId(
  publisherId: string
) {
  return getActivePublicationProfiles().filter(
    (profile) =>
      profile.publisherId ===
      publisherId
  );
}