/*
 * CoverLab AI
 * Publication Registry V2
 *
 * Public server-side API.
 *
 * Other parts of CoverLab should eventually
 * import publication functionality from this
 * file rather than reaching directly into
 * individual datasets.
 */

export type {
  AiPolicyRule,
  AiPolicyStatus,
  AiUseType,
  ArtworkKind,
  ArtworkTypeDefinition,
  ColorMode,
  ColorRequirement,
  DimensionMode,
  DisclosureRequirement,
  EdgeInsets,
  FileSizeRequirement,
  FormatRequirement,
  JournalId,
  JournalRecord,
  LayoutUnit,
  ManualPublicationRequirements,
  PhysicalDimensions,
  PhysicalUnit,
  PixelDimensions,
  PolicyRuleId,
  PublicationFormat,
  PublicationProfileId,
  PublicationRegistryDataset,
  PublicationSearchResult,
  PublicationSource,
  PublicationTechnicalProfile,
  PublisherId,
  PublisherRecord,
  RasterFormat,
  ResolvedPublicationTarget,
  ResolutionMode,
  ResolutionOrigin,
  ResolutionRequirement,
  RuleConfidence,
  RuleProvenance,
  RuleScope,
  SafeAreaRequirement,
  SourceId,
  SourceKind,
  TextRequirement,
  VectorFormat,
  VerificationStatus,
  VersionInfo,
} from "./types";

export {
  ARTWORK_TYPES,
  getArtworkTypeAliases,
  getArtworkTypeDefinition,
  normalizeArtworkTypeV2,
  normalizePublicationText,
} from "./artworkTypes";

export {
  PUBLISHERS,
  getPublisherById,
} from "./publishers";

export {
  JOURNALS,
  getJournalById,
  getJournalsByPublisherId,
} from "./journals";

export {
  PUBLICATION_SOURCES,
  getPublicationSourceById,
  getPublicationSourcesByIds,
} from "./sources";

export {
  PUBLICATION_PROFILES,
  getActivePublicationProfiles,
  getProfilesByJournalId,
  getProfilesByPublisherId,
} from "./profiles";

export {
  AI_POLICIES,
  getActiveAiPolicies,
  getAiPoliciesByJournalId,
  getAiPoliciesByPublisherId,
} from "./aiPolicies";

export {
  searchPublications,
  findJournalByNameOrAlias,
  findPublisherByNameOrAlias,
} from "./search";

export type {
  PublicationSearchOptions,
} from "./search";

export {
  hasAnyTechnicalProfile,
  hasVerifiedTechnicalProfile,
  resolvePublicationTarget,
  resolvePublicationTargetByIds,
} from "./resolver";

export {
  validatePublicationRegistry,
} from "./integrity";

export type {
  RegistryIntegrityIssue,
  RegistryIntegrityReport,
} from "./integrity";

export {
  enforceAiOperation,
} from "./enforcement";

export type {
  AiEnforcementDecision,
} from "./enforcement";
