import type {
  AiPolicyRule,
} from "./types";

export const AI_POLICIES: AiPolicyRule[] = [
  {
    id:
      "acs-langmuir-front-cover-ai-v1",

    publisherId:
      "acs",

    journalId:
      "acs-langmuir",

    artworkType:
      "Front Cover",

    aiUseTypes: [
      "generative-creation",
      "generative-refinement",
      "detail-enhancement",
    ],

    status:
      "conditional",

    disclosure: {
      required:
        true,

      instructions:
        "AI use must comply with ACS Artificial Intelligence Best Practices and be disclosed in the cover caption.",
    },

    message:
      "AI-assisted Langmuir cover art may be used subject to ACS AI requirements and disclosure in the cover caption.",

    conditions: [
      "The final cover must remain scientifically accurate.",
      "AI use must be disclosed in the cover caption.",
      "Authors remain responsible for the artwork and applicable rights.",
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
    "elsevier-graphical-abstract-generative-ai-v1",

  publisherId:
    "elsevier",

  artworkType:
    "Graphical Abstract",

  aiUseTypes: [
    "generative-creation",
    "generative-refinement",
    "detail-enhancement",
  ],

  status:
    "manual-check",

  disclosure: {
    required:
      null,
  },

  message:
    "Elsevier states that general-purpose generative AI image tools must not be used to create graphical abstracts and encourages dedicated scientific illustration tools. CoverLab is designed specifically for scientific publication artwork, but CoverLab does not determine on the author's behalf whether its use satisfies the applicable Elsevier or journal requirements. Author verification is required before proceeding.",

  conditions: [
    "Confirm the current Elsevier generative AI policy before using AI-assisted graphical abstract artwork.",
    "Confirm the target journal's current graphical abstract and AI requirements.",
    "Proceed only if you determine that the intended use of CoverLab is permitted for your submission.",
    "You remain responsible for scientific accuracy, intellectual-property rights, licensing, disclosure, and compliance with the target journal's requirements.",
  ],

  provenance: {
    sourceIds: [
      "elsevier-generative-ai-journals",
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
      "rsc-materials-horizons-toc-ai-v1",

    publisherId:
      "rsc",

    journalId:
      "rsc-materials-horizons",

    artworkType:
      "TOC Graphic",

    aiUseTypes: [
      "generative-creation",
      "generative-refinement",
      "detail-enhancement",
    ],

    status:
      "conditional",

    disclosure: {
      required:
        null,

      instructions:
        "Check the journal's current author guidance and retain evidence that the AI tool's licensing permits commercial reuse.",
    },

    message:
      "AI-assisted TOC graphics may be acceptable only when the AI tool and its training/output licensing satisfy RSC commercial-reuse requirements.",

    conditions: [
      "The AI tool must be trained using fully licensed datasets.",
      "The AI output license must permit commercial reuse.",
      "The final graphic must comply with normal RSC scholarly-publication standards.",
    ],

    provenance: {
      sourceIds: [
        "rsc-materials-horizons-author-guidelines",
        "rsc-journal-materials-chemistry-a-guidelines",
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
      "wiley-general-concept-image-ai-v1",

    publisherId:
      "wiley",

    artworkType:
      "Conceptual Illustration",

    aiUseTypes: [
      "generative-creation",
      "generative-refinement",
      "detail-enhancement",
    ],

    status:
      "conditional",

    disclosure: {
      required:
        true,

      instructions:
        "AI-assisted image use should be disclosed and the author must verify accuracy and rights.",
    },

    message:
      "Wiley's general guidance permits some explanatory and conceptual AI-assisted images when accuracy, rights, and disclosure requirements are satisfied, but individual journal policies may be stricter.",

    conditions: [
      "The image must be concept/explanatory rather than fabricated research data.",
      "Authors must verify accuracy.",
      "Authors must ensure sufficient reuse/publication rights.",
      "Journal-specific instructions may override this publisher-level guidance.",
    ],

    provenance: {
      sourceIds: [
        "wiley-ai-guidelines",
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
];

export function getActiveAiPolicies() {
  return AI_POLICIES.filter(
    (policy) =>
      policy.version.active
  );
}

export function getAiPoliciesByJournalId(
  journalId: string
) {
  return getActiveAiPolicies().filter(
    (policy) =>
      policy.journalId ===
      journalId
  );
}

export function getAiPoliciesByPublisherId(
  publisherId: string
) {
  return getActiveAiPolicies().filter(
    (policy) =>
      policy.publisherId ===
      publisherId
  );
}