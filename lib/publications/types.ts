/*
 * CoverLab AI
 * Publication Registry V2
 *
 * Central domain types for:
 *
 * - publishers
 * - journals
 * - artwork types
 * - technical requirements
 * - AI policies
 * - provenance
 * - versioning
 * - verification
 *
 * IMPORTANT:
 *
 * This file contains TYPES ONLY.
 *
 * It intentionally does not replace the
 * existing publicationRegistry.ts yet.
 *
 * The current production workflow continues
 * to use the old registry until the V2
 * resolver and compatibility layer are ready.
 */

/* =========================================================
   Artwork
   ========================================================= */

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
  | "Visual Abstract"
  | "Article Thumbnail"
  | "Other";

/*
 * Some publications use different terminology
 * for essentially the same submission asset.
 *
 * We preserve the canonical CoverLab kind above,
 * while aliases can live in journal/profile data.
 */

export type ArtworkTypeDefinition = {
  kind: ArtworkKind;

  aliases: string[];

  description?: string;
};

/* =========================================================
   Identity
   ========================================================= */

export type PublisherId = string;

export type JournalId = string;

export type PublicationProfileId = string;

export type PolicyRuleId = string;

export type SourceId = string;

/*
 * Publisher identity is deliberately separate
 * from policy and technical requirements.
 */

export type PublisherRecord = {
  id: PublisherId;

  name: string;

  aliases: string[];

  website?: string;

  active: boolean;
};

/*
 * Journals are first-class records in V2.
 *
 * This allows:
 *
 * - search
 * - aliases
 * - publisher relationships
 * - ISSN lookup later
 * - discipline filtering
 * - journal-specific overrides
 */

export type JournalRecord = {
  id: JournalId;

  name: string;

  aliases: string[];

  publisherId: PublisherId;

  issn?: string[];

  disciplines?: string[];

  website?: string;

  active: boolean;
};

/* =========================================================
   Verification / provenance
   ========================================================= */

export type VerificationStatus =
  | "verified"
  | "partially-verified"
  | "unverified"
  | "stale";

export type RuleConfidence =
  | "verified-journal"
  | "verified-publisher"
  | "verified-official-general"
  | "manual"
  | "fallback";

/*
 * Where exactly does a rule apply?
 */

export type RuleScope =
  | "publisher"
  | "journal"
  | "artwork-type"
  | "journal-artwork-type"
  | "manual"
  | "unknown";

export type SourceKind =
  | "official-publisher"
  | "official-journal"
  | "official-author-guidelines"
  | "official-submission-guidelines"
  | "official-ai-policy"
  | "official-help-page"
  | "manual-user-entry"
  | "other-official";

/*
 * Every important rule should ultimately be
 * traceable to a source.
 *
 * We do NOT want:
 *
 *     widthPx: 1200
 *
 * with no explanation of where 1200 came from.
 */

export type PublicationSource = {
  id: SourceId;

  kind: SourceKind;

  title: string;

  url: string;

  publisherId?: PublisherId;

  journalId?: JournalId;

  accessedOn: string;

  publishedOn?: string;

  notes?: string[];
};

/*
 * Provenance can be attached to a technical
 * profile or an AI policy.
 */

export type RuleProvenance = {
  sourceIds: SourceId[];

  verifiedOn: string;

  verificationStatus: VerificationStatus;

  confidence: RuleConfidence;

  verifiedBy?: string;

  notes?: string[];
};

/* =========================================================
   Versioning
   ========================================================= */

/*
 * Publication requirements change over time.
 *
 * A profile should therefore be versionable
 * instead of silently overwritten.
 */

export type VersionInfo = {
  version: number;

  effectiveFrom?: string;

  effectiveUntil?: string;

  supersedesId?: string;

  active: boolean;
};

/* =========================================================
   Dimensions
   ========================================================= */

export type DimensionMode =
  | "exact"
  | "minimum"
  | "maximum"
  | "range"
  | "recommended";

/*
 * Physical dimensions are stored structurally.
 *
 * Do not store only strings such as:
 *
 *     "8.19 inches"
 *
 * because we eventually need reliable
 * conversions and validation.
 */

export type PhysicalUnit =
  | "mm"
  | "cm"
  | "in";

export type PhysicalDimensions = {
  width: number;

  height: number;

  unit: PhysicalUnit;
};

export type PixelDimensions = {
  mode: DimensionMode;

  widthPx?: number;

  heightPx?: number;

  minimumWidthPx?: number;

  minimumHeightPx?: number;

  maximumWidthPx?: number;

  maximumHeightPx?: number;
};

/* =========================================================
   Aspect ratio
   ========================================================= */

export type AspectRatioRequirement = {
  /*
   * Example:
   *
   * width: 819
   * height: 1000
   */

  width: number;

  height: number;

  /*
   * Percentage difference tolerated by
   * CoverLab before blocking an export.
   *
   * This is a CoverLab validation value,
   * NOT automatically a journal requirement.
   */

  tolerancePercent?: number;
};

/* =========================================================
   Resolution
   ========================================================= */

export type ResolutionMode =
  | "exact"
  | "minimum"
  | "recommended";

export type ResolutionRequirement = {
  mode: ResolutionMode;

  dpi: number;

  /*
   * Journals sometimes specify different
   * resolution requirements depending on
   * artwork content.
   */

  appliesTo?:
    | "all"
    | "continuous-tone"
    | "line-art"
    | "combination-art";
};

/* =========================================================
   File formats
   ========================================================= */

export type RasterFormat =
  | "PNG"
  | "JPEG"
  | "TIFF";

export type VectorFormat =
  | "PDF"
  | "EPS"
  | "SVG";

export type PublicationFormat =
  | RasterFormat
  | VectorFormat;

export type FormatRequirement = {
  format: PublicationFormat;

  allowed: boolean;

  preferred?: boolean;

  notes?: string[];
};

/* =========================================================
   Color
   ========================================================= */

export type ColorMode =
  | "RGB"
  | "sRGB"
  | "CMYK"
  | "Grayscale"
  | "Other";

export type ColorRequirement = {
  allowedModes: ColorMode[];

  preferredMode?: ColorMode;

  iccProfile?: string;

  notes?: string[];
};

/* =========================================================
   File size
   ========================================================= */

export type FileSizeRequirement = {
  minimumBytes?: number;

  maximumBytes?: number;

  recommendedMaximumBytes?: number;
};

/* =========================================================
   Layout / safe areas
   ========================================================= */

export type EdgeInsets = {
  top?: number;

  right?: number;

  bottom?: number;

  left?: number;
};

export type LayoutUnit =
  | "px"
  | "mm"
  | "cm"
  | "in"
  | "percent";

export type SafeAreaRequirement = {
  unit: LayoutUnit;

  /*
   * General safe area.
   */

  safeArea?: EdgeInsets;

  /*
   * Space that must remain suitable for
   * publisher/journal masthead placement.
   */

  mastheadArea?: EdgeInsets;

  /*
   * Required bleed beyond trim.
   */

  bleed?: EdgeInsets;

  notes?: string[];
};

/* =========================================================
   Transparency / background
   ========================================================= */

export type BackgroundRequirement = {
  transparencyAllowed?: boolean;

  backgroundRequired?: boolean;

  preferredBackground?: string;

  notes?: string[];
};

/* =========================================================
   Text / typography
   ========================================================= */

export type TextRequirement = {
  textAllowed?: boolean;

  minimumFontSizePt?: number;

  embeddedFontsRequired?: boolean;

  notes?: string[];
};

/* =========================================================
   Technical profile
   ========================================================= */

/*
 * This is the core publication requirement
 * record.
 *
 * A profile may belong to:
 *
 * - publisher + artwork type
 * - journal + artwork type
 *
 * Journal-specific profiles override
 * publisher-level defaults.
 */

export type PublicationTechnicalProfile = {
  id: PublicationProfileId;

  publisherId: PublisherId;

  journalId?: JournalId;

  artworkType: ArtworkKind;

  artworkAliases?: string[];

  dimensions?: PixelDimensions;

  physicalDimensions?: PhysicalDimensions;

  aspectRatio?: AspectRatioRequirement;

  resolution?: ResolutionRequirement[];

  formats?: FormatRequirement[];

  color?: ColorRequirement;

  fileSize?: FileSizeRequirement;

  safeAreas?: SafeAreaRequirement;

  background?: BackgroundRequirement;

  text?: TextRequirement;

  notes?: string[];

  provenance: RuleProvenance;

  version: VersionInfo;
};

/* =========================================================
   AI policy
   ========================================================= */

export type AiPolicyStatus =
  | "allowed"
  | "conditional"
  | "not-allowed"
  | "manual-check";

/*
 * AI policy must be able to distinguish
 * different uses of AI.
 *
 * For example:
 *
 * - generative creation
 * - refinement
 * - detail enhancement
 * - non-generative editing
 *
 * A publisher may treat them differently.
 */

export type AiUseType =
  | "generative-creation"
  | "generative-refinement"
  | "detail-enhancement"
  | "non-generative-editing"
  | "unknown";

/*
 * Explicitly model disclosure rather than
 * hiding it inside a free-text note.
 */

export type DisclosureRequirement = {
  required: boolean | null;

  instructions?: string;

  suggestedText?: string;
};

export type AiPolicyRule = {
  id: PolicyRuleId;

  publisherId: PublisherId;

  journalId?: JournalId;

  artworkType?: ArtworkKind;

  aiUseTypes: AiUseType[];

  status: AiPolicyStatus;

  disclosure: DisclosureRequirement;

  message: string;

  conditions?: string[];

  notes?: string[];

  provenance: RuleProvenance;

  version: VersionInfo;
};

/* =========================================================
   Manual/custom requirements
   ========================================================= */

/*
 * Journals not yet present in the CoverLab
 * database must still be usable.
 *
 * The user may manually enter requirements,
 * but CoverLab must NEVER label those values
 * as officially verified.
 */

export type ManualPublicationRequirements = {
  publisherName?: string;

  journalName: string;

  artworkType: ArtworkKind;

  dimensions?: PixelDimensions;

  physicalDimensions?: PhysicalDimensions;

  resolution?: ResolutionRequirement[];

  formats?: FormatRequirement[];

  color?: ColorRequirement;

  notes?: string[];

  enteredOn: string;
};

/* =========================================================
   Resolution result
   ========================================================= */

export type ResolutionOrigin =
  | "journal"
  | "publisher"
  | "manual"
  | "none";

/*
 * The V2 resolver will eventually return
 * this object.
 *
 * UI components should ultimately consume
 * ONE resolved object instead of resolving
 * different rules independently.
 */

export type ResolvedPublicationTarget = {
  publisher:
    | PublisherRecord
    | null;

  journal:
    | JournalRecord
    | null;

  artworkType: ArtworkKind;

  technicalProfile:
    | PublicationTechnicalProfile
    | null;

  aiPolicy:
    | AiPolicyRule
    | null;

  technicalOrigin: ResolutionOrigin;

  policyOrigin: ResolutionOrigin;

  requiresManualTechnicalCheck: boolean;

  requiresManualPolicyCheck: boolean;

  warnings: string[];
};

/* =========================================================
   Search
   ========================================================= */

export type PublicationSearchResult = {
  journalId: JournalId;

  journalName: string;

  publisherId: PublisherId;

  publisherName: string;

  matchedAlias?: string;

  disciplines: string[];

  hasVerifiedProfiles: boolean;
};

/* =========================================================
   Registry dataset
   ========================================================= */

/*
 * This allows the registry to remain a plain
 * TypeScript dataset initially.
 *
 * Later the same shape can be loaded from a
 * database/API without changing the resolver's
 * domain model.
 */

export type PublicationRegistryDataset = {
  publishers: PublisherRecord[];

  journals: JournalRecord[];

  profiles: PublicationTechnicalProfile[];

  aiPolicies: AiPolicyRule[];

  sources: PublicationSource[];
};