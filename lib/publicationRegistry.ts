export type PolicyStatus =
  | "allowed"
  | "conditional"
  | "not-allowed"
  | "manual-check";

export type PolicyScope =
  | "publisher"
  | "journal"
  | "unknown";

export type RuleConfidence =
  | "verified-journal"
  | "verified-publisher"
  | "fallback";

export type ArtworkKind =
  | "Front Cover"
  | "Supplementary Cover"
  | "Inside Cover"
  | "Back Cover"
  | "Graphical Abstract"
  | "TOC Graphic"
  | "Highlights Graphic"
  | "Figure"
  | "Scheme"
  | "Conceptual Illustration"
  | "Infographic"
  | "Other";

export type AiPolicyRule = {
  status: PolicyStatus;

  disclosureRequired: boolean | null;

  message: string;

  scope: PolicyScope;

  verifiedOn: string;

  sourceUrl: string;

  notes?: string[];
};

export type GenericQualityRule = {
  dpi?: number;

  preferredFormats?: string[];

  minimumWidthPx?: number;

  minimumHeightPx?: number;

  notes?: string[];

  sourceUrl?: string;

  verifiedOn?: string;
};

export type PublisherPolicy = {
  id: string;

  name: string;

  aliases?: string[];

  aiPolicies: Partial<
    Record<
      ArtworkKind,
      AiPolicyRule
    >
  >;

  genericQuality?: GenericQualityRule;
};

export type ExactPublicationProfile = {
  id: string;

  publisher: string;

  journal?: string;

  journalAliases?: string[];

  artworkType: ArtworkKind;

  widthPx: number;

  heightPx: number;

  dpi: number;

  widthPhysical?: string;

  heightPhysical?: string;

  formats: string[];

  mastheadSafeAreaPx?: number;

  notes: string[];

  verifiedOn: string;

  sourceUrl: string;

  confidence: RuleConfidence;
};

export type ResolvedPublicationRules = {
  publisher: PublisherPolicy | null;

  aiPolicy: AiPolicyRule;

  exactProfile: ExactPublicationProfile | null;

  confidence: RuleConfidence;

  requiresManualJournalCheck: boolean;
};

const UNKNOWN_POLICY: AiPolicyRule = {
  status: "manual-check",

  disclosureRequired: null,

  message:
    "CoverLab does not yet have a verified AI-image policy for this publisher, journal, and artwork type. Manual verification is required.",

  scope: "unknown",

  verifiedOn: "2026-08-19",

  sourceUrl: "",
};

function policy(
  status: PolicyStatus,
  disclosureRequired: boolean | null,
  message: string,
  sourceUrl: string,
  notes: string[] = []
): AiPolicyRule {
  return {
    status,
    disclosureRequired,
    message,
    scope: "publisher",
    verifiedOn: "2026-08-19",
    sourceUrl,
    notes,
  };
}

export const publisherPolicies: PublisherPolicy[] = [
  {
    id: "acs",

    name: "ACS",

    aliases: [
      "American Chemical Society",
      "ACS Publications",
    ],

    aiPolicies: {
      "Front Cover": policy(
        "allowed",
        true,
        "ACS currently permits AI-generated journal cover artwork when the AI use is disclosed in the cover-art caption.",
        "https://researcher-resources.acs.org/publish/aipolicy",
        [
          "The specific AI tool should be named.",
          "Authors remain responsible for commercial-use rights.",
        ]
      ),

      "Supplementary Cover": policy(
        "allowed",
        true,
        "ACS currently permits AI-generated cover artwork when the AI use is disclosed.",
        "https://researcher-resources.acs.org/publish/aipolicy"
      ),

      "TOC Graphic": policy(
        "not-allowed",
        null,
        "ACS currently states that AI-generated images should not be used within Table of Contents graphics.",
        "https://researcher-resources.acs.org/publish/aipolicy"
      ),

      "Graphical Abstract": policy(
        "manual-check",
        true,
        "ACS journals frequently treat graphical abstracts as TOC/Abstract graphics. The exact journal terminology must be checked before submission.",
        "https://researcher-resources.acs.org/publish/aipolicy"
      ),

      "Figure": policy(
        "conditional",
        true,
        "AI use in graphics requires disclosure and must preserve scientific integrity. Exact acceptability depends on the type of figure and journal guidance.",
        "https://researcher-resources.acs.org/publish/aipolicy"
      ),

      "Conceptual Illustration": policy(
        "conditional",
        true,
        "Conceptual AI-generated graphics may be acceptable with disclosure, subject to journal-specific editorial requirements.",
        "https://researcher-resources.acs.org/publish/aipolicy"
      ),
    },

    genericQuality: {
      dpi: 300,

      preferredFormats: [
        "TIFF",
        "PNG",
        "JPEG",
        "EPS",
      ],

      notes: [
        "Exact cover dimensions vary between ACS journals.",
        "TOC/Abstract graphic dimensions may also vary by journal.",
      ],

      sourceUrl:
        "https://researcher-resources.acs.org/publish/author_guidelines",

      verifiedOn:
        "2026-08-19",
    },
  },

  {
    id: "elsevier",

    name: "Elsevier",

    aiPolicies: {
      "Graphical Abstract": policy(
        "manual-check",
        null,
        "Elsevier states that general-purpose generative AI image tools must not be used to create graphical abstracts and encourages dedicated scientific illustration tools. CoverLab is designed specifically for scientific publication artwork, but CoverLab does not determine on the author's behalf whether its use satisfies the applicable Elsevier or journal requirements. Author verification is required before proceeding.",
        "https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals"
      ),

      "Front Cover": policy(
        "conditional",
        true,
        "AI-generated cover artwork may in some cases be permitted, but prior permission from the journal editor and publisher is required.",
        "https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals"
      ),

      "Conceptual Illustration": policy(
        "allowed",
        true,
        "Generative AI may be used for explanatory or conceptual images when authors verify accuracy and disclose AI use.",
        "https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals"
      ),

      "Figure": policy(
        "conditional",
        true,
        "AI-generated explanatory figures may be permitted, but primary research images must not be fabricated or altered by generative AI.",
        "https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals"
      ),

      "Scheme": policy(
        "conditional",
        true,
        "AI-assisted schematic illustrations may be acceptable when scientifically accurate and disclosed.",
        "https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals"
      ),
    },
  },

  {
    id: "wiley",

    name: "Wiley",

    aliases: [
      "Wiley-VCH",
      "John Wiley & Sons",
    ],

    aiPolicies: {
      "Front Cover": policy(
        "manual-check",
        true,
        "Wiley requires responsible and transparent AI use, but cover-art acceptance can be journal-specific.",
        "https://www.wiley.com/en-us/publish/article/ai-guidelines/"
      ),

      "Graphical Abstract": policy(
        "manual-check",
        true,
        "AI-image rules may differ between Wiley journals and partner societies. Journal-specific verification is required.",
        "https://www.wiley.com/en-us/publish/article/ai-guidelines/"
      ),

      "Figure": policy(
        "conditional",
        true,
        "AI-generated or AI-edited figures require transparency and author verification; individual journal policies may be stricter.",
        "https://www.wiley.com/en-us/publish/article/ai-guidelines/"
      ),

      "Conceptual Illustration": policy(
        "conditional",
        true,
        "AI imagery may be subject to licensing, attribution and journal-specific restrictions.",
        "https://www.wiley.com/en-us/publish/article/ai-guidelines/"
      ),
    },

    genericQuality: {
      preferredFormats: [
        "TIFF",
        "EPS",
        "PNG",
        "JPEG",
      ],

      notes: [
        "Exact resolution requirements depend on figure type and journal.",
      ],

      sourceUrl:
        "https://authors.wiley.com/author-resources/Journal-Authors/Prepare/manuscript-preparation-guidelines.html/figure-preparation.html",

      verifiedOn:
        "2026-08-19",
    },
  },

  {
    id: "taylor-francis",

    name: "Taylor & Francis",

    aliases: [
      "Taylor and Francis",
      "T&F",
    ],

    aiPolicies: {
      "Figure": policy(
        "conditional",
        true,
        "Generative AI must not manipulate original research images or research data. Some conceptual or illustrative uses are permitted with disclosure.",
        "https://authorservices.taylorandfrancis.com/editorial-policies/images-and-figures/"
      ),

      "Conceptual Illustration": policy(
        "allowed",
        true,
        "AI-assisted conceptual illustrations, process diagrams and teaching illustrations are permitted when transparent and scientifically accurate.",
        "https://authorservices.taylorandfrancis.com/editorial-policies/images-and-figures/",
        [
          "Authors should retain prompts and image versions.",
          "AI tool name and version should be declared.",
        ]
      ),

      "Graphical Abstract": policy(
        "conditional",
        true,
        "AI-assisted conceptual artwork may be permitted, but journal-specific graphical-abstract requirements must be checked.",
        "https://authorservices.taylorandfrancis.com/editorial-policies/images-and-figures/"
      ),

      "Front Cover": policy(
        "manual-check",
        true,
        "Cover-specific AI policy is not uniform across all Taylor & Francis journals. Verify with the target journal.",
        "https://authorservices.taylorandfrancis.com/editorial-policies/images-and-figures/"
      ),
    },
  },

  {
    id: "springer-nature",

    name: "Springer Nature",

    aliases: [
      "Springer",
      "BMC",
      "Palgrave Macmillan",
    ],

    aiPolicies: {
      "Front Cover": policy(
        "not-allowed",
        true,
        "Springer Nature generally does not permit generative-AI images for publication except limited defined exceptions.",
        "https://group.springernature.com/gp/group/ai/ai-guidance-for-our-researchers-and-communities"
      ),

      "Graphical Abstract": policy(
        "not-allowed",
        true,
        "Generative-AI imagery is generally not permitted for publication except limited defined exceptions.",
        "https://group.springernature.com/gp/group/ai/ai-guidance-for-our-researchers-and-communities"
      ),

      "Figure": policy(
        "not-allowed",
        true,
        "Generative-AI images or figures are generally not permitted unless they meet specific exceptions.",
        "https://group.springernature.com/gp/group/ai/ai-guidance-for-our-researchers-and-communities"
      ),

      "Conceptual Illustration": policy(
        "not-allowed",
        true,
        "Generative-AI images are generally not permitted except for limited, specifically defined cases.",
        "https://group.springernature.com/gp/group/ai/ai-guidance-for-our-researchers-and-communities"
      ),
    },
  },

  {
    id: "nature",

    name: "Nature Portfolio",

    aliases: [
      "Nature",
      "Nature Communications",
      "Scientific Reports",
    ],

    aiPolicies: {
      "Front Cover": policy(
        "not-allowed",
        true,
        "Nature Portfolio generally does not permit generative-AI images except limited defined exceptions.",
        "https://www.nature.com/nature-portfolio/editorial-policies/ai"
      ),

      "Graphical Abstract": policy(
        "not-allowed",
        true,
        "Generative-AI imagery is generally not permitted except limited defined exceptions.",
        "https://www.nature.com/nature-portfolio/editorial-policies/ai"
      ),

      "Figure": policy(
        "not-allowed",
        true,
        "Generative-AI images are generally not permitted except limited defined exceptions.",
        "https://www.nature.com/nature-portfolio/editorial-policies/ai"
      ),
    },
  },

  {
    id: "science-aaas",

    name: "Science / AAAS",

    aliases: [
      "Science",
      "AAAS",
      "Science Advances",
      "Science Translational Medicine",
      "Science Robotics",
    ],

    aiPolicies: {
      "Front Cover": policy(
        "conditional",
        true,
        "AI-generated imagery requires explicit editorial permission.",
        "https://www.science.org/content/page/science-journals-editorial-policies"
      ),

      "Graphical Abstract": policy(
        "conditional",
        true,
        "AI-generated imagery requires explicit editorial permission.",
        "https://www.science.org/content/page/science-journals-editorial-policies"
      ),

      "Figure": policy(
        "conditional",
        true,
        "AI-generated images and multimedia require explicit editorial permission.",
        "https://www.science.org/content/page/science-journals-editorial-policies"
      ),

      "Conceptual Illustration": policy(
        "conditional",
        true,
        "AI-generated imagery requires explicit editorial permission.",
        "https://www.science.org/content/page/science-journals-editorial-policies"
      ),
    },
  },

  {
    id: "rsc",

    name: "RSC",

    aliases: [
      "Royal Society of Chemistry",
    ],

    aiPolicies: {
      "TOC Graphic": policy(
        "conditional",
        true,
        "AI-assisted illustrative graphics may be used when licensing permits commercial reuse and AI use is disclosed.",
        "https://www.rsc.org/publishing/journals/processes-and-policies/author-responsibilities"
      ),

      "Graphical Abstract": policy(
        "conditional",
        true,
        "AI-assisted illustrative graphics may be used subject to licensing, originality and disclosure requirements.",
        "https://www.rsc.org/publishing/journals/processes-and-policies/author-responsibilities"
      ),

      "Front Cover": policy(
        "conditional",
        true,
        "AI-assisted aesthetic or illustrative cover artwork may be used subject to licensing and disclosure requirements.",
        "https://www.rsc.org/publishing/journals/processes-and-policies/author-responsibilities"
      ),

      "Figure": policy(
        "conditional",
        true,
        "Illustrative AI graphics may be permitted, but generative AI must not alter submitted primary research images.",
        "https://www.rsc.org/publishing/journals/processes-and-policies/author-responsibilities"
      ),

      "Conceptual Illustration": policy(
        "allowed",
        true,
        "AI-created illustrative or aesthetic graphics may be used with disclosure and appropriate licensing.",
        "https://www.rsc.org/publishing/journals/processes-and-policies/author-responsibilities"
      ),
    },

    genericQuality: {
      dpi: 600,

      preferredFormats: [
        "TIFF",
        "EPS",
        "PDF",
      ],

      notes: [
        "Many RSC journals request 600 dpi or greater for figures.",
        "TOC dimensions must still be checked at journal level.",
      ],

      verifiedOn:
        "2026-08-19",
    },
  },

  {
    id: "frontiers",

    name: "Frontiers",

    aiPolicies: {
      "Graphical Abstract": policy(
        "conditional",
        true,
        "Generative-AI visual content may be used when scientifically checked, plagiarism-free and acknowledged.",
        "https://www.frontiersin.org/journals/artificial-intelligence/for-authors/author-guidelines"
      ),

      "Figure": policy(
        "conditional",
        true,
        "AI-produced or AI-edited figures must accurately reflect manuscript data and AI use must be acknowledged.",
        "https://www.frontiersin.org/journals/artificial-intelligence/for-authors/author-guidelines"
      ),

      "Conceptual Illustration": policy(
        "conditional",
        true,
        "Visual GenAI content may be used with factual verification and disclosure.",
        "https://www.frontiersin.org/journals/artificial-intelligence/for-authors/author-guidelines"
      ),

      "Front Cover": policy(
        "manual-check",
        true,
        "Frontiers permits some AI visual content, but cover-specific rules should be checked with the journal.",
        "https://www.frontiersin.org/journals/artificial-intelligence/for-authors/author-guidelines"
      ),
    },
  },

  {
    id: "ieee",

    name: "IEEE",

    aiPolicies: {
      "Figure": policy(
        "conditional",
        true,
        "IEEE permits AI-generated content, including figures and images, when use is disclosed in the acknowledgments.",
        "https://journals.ieeeauthorcenter.ieee.org/become-an-ieee-journal-author/publishing-ethics/guidelines-and-policies/submission-and-peer-review-policies/"
      ),

      "Conceptual Illustration": policy(
        "conditional",
        true,
        "AI-generated image content requires disclosure and author responsibility.",
        "https://journals.ieeeauthorcenter.ieee.org/become-an-ieee-journal-author/publishing-ethics/guidelines-and-policies/submission-and-peer-review-policies/"
      ),

      "Graphical Abstract": policy(
        "manual-check",
        true,
        "IEEE's general AI-content disclosure policy applies, but graphical-abstract requirements are journal-specific.",
        "https://journals.ieeeauthorcenter.ieee.org/become-an-ieee-journal-author/publishing-ethics/guidelines-and-policies/submission-and-peer-review-policies/"
      ),

      "Front Cover": policy(
        "manual-check",
        true,
        "Cover rules vary across IEEE publications and require journal-specific verification.",
        "https://journals.ieeeauthorcenter.ieee.org/become-an-ieee-journal-author/publishing-ethics/guidelines-and-policies/submission-and-peer-review-policies/"
      ),
    },
  },

  {
    id: "iop",

    name: "IOP Publishing",

    aliases: [
      "IOP",
      "Institute of Physics",
    ],

    aiPolicies: {
      "Figure": policy(
        "conditional",
        true,
        "IOP permits AI-generated figures derived from existing research data, while fabrication or manipulation of original research data or images is prohibited.",
        "https://publishingsupport.iopscience.iop.org/questions/generative-ai-tools/"
      ),

      "Conceptual Illustration": policy(
        "manual-check",
        true,
        "IOP's current general policy focuses on data-derived figures. Journal-specific verification is recommended for purely illustrative AI imagery.",
        "https://publishingsupport.iopscience.iop.org/questions/generative-ai-tools/"
      ),

      "Graphical Abstract": policy(
        "manual-check",
        true,
        "Graphical-abstract requirements are journal-specific and should be verified.",
        "https://publishingsupport.iopscience.iop.org/questions/generative-ai-tools/"
      ),
    },
  },

  {
    id: "plos",

    name: "PLOS",

    aliases: [
      "Public Library of Science",
      "PLOS ONE",
      "PLOS Biology",
      "PLOS Computational Biology",
    ],

    aiPolicies: {
      "Figure": policy(
        "conditional",
        true,
        "PLOS requires AI contributions to be reported and prohibits fabrication or misrepresentation of primary research data.",
        "https://journals.plos.org/plosone/s/ethical-publishing-practice"
      ),

      "Conceptual Illustration": policy(
        "conditional",
        true,
        "AI-created content must be reported and remain scientifically accurate.",
        "https://journals.plos.org/plosone/s/ethical-publishing-practice"
      ),

      "Graphical Abstract": policy(
        "manual-check",
        true,
        "PLOS journal-specific visual-summary requirements should be checked before submission.",
        "https://journals.plos.org/plosone/s/ethical-publishing-practice"
      ),
    },
  },

  {
    id: "oup",

    name: "Oxford University Press",

    aliases: [
      "OUP",
      "Oxford Academic",
    ],

    aiPolicies: {
      "Figure": policy(
        "manual-check",
        true,
        "OUP directs journal authors to the specific journal's Instructions for Authors because policies may differ.",
        "https://academic.oup.com/pages/for-authors/books/author-use-of-artificial-intelligence"
      ),

      "Conceptual Illustration": policy(
        "manual-check",
        true,
        "OUP AI-image policy may differ across journals; journal-specific verification is required.",
        "https://academic.oup.com/pages/for-authors/books/author-use-of-artificial-intelligence"
      ),

      "Front Cover": policy(
        "manual-check",
        true,
        "Verify the specific Oxford Academic journal's AI-image and cover rules.",
        "https://academic.oup.com/pages/for-authors/books/author-use-of-artificial-intelligence"
      ),

      "Graphical Abstract": policy(
        "manual-check",
        true,
        "Verify the specific Oxford Academic journal's instructions.",
        "https://academic.oup.com/pages/for-authors/books/author-use-of-artificial-intelligence"
      ),
    },
  },

  /*
    Publishers below are supported structurally.

    We deliberately DO NOT invent an AI policy
    until CoverLab has a verified primary source.
  */

  ...[
    "MDPI",
    "SAGE",
    "Cambridge University Press",
    "AIP Publishing",
    "PNAS",
    "Cell Press",
    "BMJ",
    "JAMA Network",
    "American Physical Society",
    "American Mathematical Society",
    "SPIE",
    "Emerald",
    "De Gruyter",
    "Bentham Science",
    "Hindawi",
  ].map(
    (name): PublisherPolicy => ({
      id: slugify(name),

      name,

      aiPolicies: {},

      genericQuality: {
        notes: [
          "CoverLab supports this publisher, but verified artwork-specific rules have not yet been added to the registry.",
        ],
      },
    })
  ),
];

/*
=====================================================
EXACT PUBLICATION PROFILES
=====================================================

Important principle:

Only add an exact profile when the dimensions
have been verified from an official publisher or
journal source.

Do NOT infer dimensions from another journal.
*/

export const exactProfiles: ExactPublicationProfile[] = [
  {
    id: "langmuir-front-cover",

    publisher: "ACS",

    journal: "Langmuir",

    artworkType: "Front Cover",

    widthPx: 2457,

    heightPx: 3000,

    dpi: 300,

    widthPhysical:
      "8.19 in",

    heightPhysical:
      "10.00 in",

    formats: [
      "TIFF",
      "JPEG",
      "PNG",
      "EPS",
    ],

    mastheadSafeAreaPx: 750,

    notes: [
      "The journal title covers the top 2.5 inches of the submitted artwork.",
      "Cover art should be artistic and scientifically accurate rather than resemble a graphical abstract.",
      "AI use must comply with ACS AI policy and be disclosed in the cover caption.",
    ],

    verifiedOn:
      "2026-08-19",

    sourceUrl:
      "https://researcher-resources.acs.org/publish/author_guidelines?coden=langd5",

    confidence:
      "verified-journal",
  },

  {
    id: "elsevier-graphical-abstract",

    publisher: "Elsevier",

    artworkType:
      "Graphical Abstract",

    widthPx: 1328,

    heightPx: 531,

    dpi: 300,

    widthPhysical:
      "13.28 arbitrary ratio reference",

    heightPhysical:
      "5.31 arbitrary ratio reference",

    formats: [
      "TIFF",
      "EPS",
      "PDF",
    ],

    notes: [
      "Minimum size is 1328 × 531 pixels.",
      "Use the same approximately 2.5:1 aspect ratio if submitting a larger image.",
      "General-purpose generative AI tools are currently not permitted for Elsevier graphical abstracts.",
    ],

    verifiedOn:
      "2026-08-19",

    sourceUrl:
      "https://www.elsevier.com/researcher/author/tools-and-resources/graphical-abstract",

    confidence:
      "verified-publisher",
  },

  {
    id: "materials-horizons-toc",

    publisher: "RSC",

    journal:
      "Materials Horizons",

    artworkType:
      "TOC Graphic",

    widthPx: 1890,

    heightPx: 945,

    dpi: 600,

    widthPhysical:
      "8 cm",

    heightPhysical:
      "4 cm",

    formats: [
      "TIFF",
    ],

    notes: [
      "Maximum TOC graphic size is 8 cm × 4 cm.",
      "TIFF at 600 dpi or greater is requested.",
    ],

    verifiedOn:
      "2026-08-19",

    sourceUrl:
      "https://www.rsc.org/publishing/publish-with-us/publish-a-journal-article/materials-horizons",

    confidence:
      "verified-journal",
  },
];

export function getPublisherPolicy(
  publisherName: string
): PublisherPolicy | null {
  const normalized =
    normalize(publisherName);

  return (
    publisherPolicies.find(
      (publisher) => {
        if (
          normalize(
            publisher.name
          ) === normalized
        ) {
          return true;
        }

        return (
          publisher.aliases?.some(
            (alias) =>
              normalize(alias) ===
              normalized
          ) ?? false
        );
      }
    ) ?? null
  );
}

export function findExactProfile(
  publisherName: string,
  journalName: string,
  artworkType: string
): ExactPublicationProfile | null {
  const publisher =
    getPublisherPolicy(
      publisherName
    );

  const normalizedPublisher =
    publisher
      ? normalize(
          publisher.name
        )
      : normalize(
          publisherName
        );

  const normalizedJournal =
    normalize(journalName);

  /*
    1. First prefer a journal-specific profile.
  */

  const journalProfile =
    exactProfiles.find(
      (profile) => {
        const samePublisher =
          normalize(
            profile.publisher
          ) ===
          normalizedPublisher;

        const sameArtwork =
          profile.artworkType ===
          artworkType;

        const journalNames = [
          profile.journal,
          ...(profile.journalAliases ??
            []),
        ]
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
          .map(normalize);

        return (
          samePublisher &&
          sameArtwork &&
          journalNames.includes(
            normalizedJournal
          )
        );
      }
    );

  if (journalProfile) {
    return journalProfile;
  }

  /*
    2. Then use a verified publisher-wide profile,
       but ONLY where journal is intentionally omitted.
  */

  return (
    exactProfiles.find(
      (profile) =>
        !profile.journal &&
        normalize(
          profile.publisher
        ) ===
          normalizedPublisher &&
        profile.artworkType ===
          artworkType
    ) ?? null
  );
}

export function resolvePublicationRules(
  publisherName: string,
  journalName: string,
  artworkType: string
): ResolvedPublicationRules {
  const publisher =
    getPublisherPolicy(
      publisherName
    );

  const exactProfile =
    findExactProfile(
      publisherName,
      journalName,
      artworkType
    );

  const aiPolicy =
    publisher?.aiPolicies[
      artworkType as ArtworkKind
    ] ?? UNKNOWN_POLICY;

  const confidence =
    exactProfile?.confidence ??
    (publisher
      ? "verified-publisher"
      : "fallback");

  return {
    publisher,

    aiPolicy,

    exactProfile,

    confidence,

    requiresManualJournalCheck:
      !exactProfile ||
      aiPolicy.status ===
        "manual-check",
  };
}

export function normalizeArtworkType(
  value: string
): ArtworkKind {
  const normalized =
    normalize(value);

  if (
    normalized.includes(
      "front cover"
    )
  ) {
    return "Front Cover";
  }

  if (
    normalized.includes(
      "supplementary cover"
    )
  ) {
    return "Supplementary Cover";
  }

  if (
    normalized.includes(
      "inside cover"
    )
  ) {
    return "Inside Cover";
  }

  if (
    normalized.includes(
      "back cover"
    )
  ) {
    return "Back Cover";
  }

  if (
    normalized.includes(
      "graphical abstract"
    )
  ) {
    return "Graphical Abstract";
  }

  if (
    normalized.includes(
      "toc"
    ) ||
    normalized.includes(
      "table of contents"
    )
  ) {
    return "TOC Graphic";
  }

  if (
    normalized.includes(
      "highlight"
    )
  ) {
    return "Highlights Graphic";
  }

  if (
    normalized.includes(
      "scheme"
    )
  ) {
    return "Scheme";
  }

  if (
    normalized.includes(
      "infographic"
    )
  ) {
    return "Infographic";
  }

  if (
    normalized.includes(
      "illustration"
    )
  ) {
    return "Conceptual Illustration";
  }

  if (
    normalized.includes(
      "figure"
    )
  ) {
    return "Figure";
  }

  return "Other";
}

function normalize(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(
      /\s+/g,
      " "
    );
}

function slugify(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}