import type {
  AiPolicyRule,
  ArtworkKind,
  PublicationTechnicalProfile,
  ResolvedPublicationTarget,
  ResolutionOrigin,
} from "./types";

import {
  PUBLISHERS,
} from "./publishers";

import {
  JOURNALS,
} from "./journals";

import {
  PUBLICATION_PROFILES,
} from "./profiles";

import {
  AI_POLICIES,
} from "./aiPolicies";

import {
  normalizeArtworkTypeV2,
  normalizePublicationText,
} from "./artworkTypes";

import {
  findJournalByNameOrAlias,
  findPublisherByNameOrAlias,
} from "./search";


/* =========================================================
   Internal helpers
   ========================================================= */

function isProfileActive(
  profile: PublicationTechnicalProfile
) {
  return profile.version.active;
}


function isPolicyActive(
  policy: AiPolicyRule
) {
  return policy.version.active;
}


function sameArtworkType(
  left: ArtworkKind,
  right: ArtworkKind
) {
  return left === right;
}


function findJournalProfile(
  publisherId: string,
  journalId: string,
  artworkType: ArtworkKind
): PublicationTechnicalProfile | null {
  return (
    PUBLICATION_PROFILES.find(
      (profile) =>
        isProfileActive(
          profile
        ) &&
        profile.publisherId ===
          publisherId &&
        profile.journalId ===
          journalId &&
        sameArtworkType(
          profile.artworkType,
          artworkType
        )
    ) ?? null
  );
}


function findPublisherProfile(
  publisherId: string,
  artworkType: ArtworkKind
): PublicationTechnicalProfile | null {
  return (
    PUBLICATION_PROFILES.find(
      (profile) =>
        isProfileActive(
          profile
        ) &&
        profile.publisherId ===
          publisherId &&
        !profile.journalId &&
        sameArtworkType(
          profile.artworkType,
          artworkType
        )
    ) ?? null
  );
}


function findJournalPolicy(
  publisherId: string,
  journalId: string,
  artworkType: ArtworkKind
): AiPolicyRule | null {
  return (
    AI_POLICIES.find(
      (policy) =>
        isPolicyActive(
          policy
        ) &&
        policy.publisherId ===
          publisherId &&
        policy.journalId ===
          journalId &&
        policy.artworkType ===
          artworkType
    ) ?? null
  );
}


function findPublisherArtworkPolicy(
  publisherId: string,
  artworkType: ArtworkKind
): AiPolicyRule | null {
  return (
    AI_POLICIES.find(
      (policy) =>
        isPolicyActive(
          policy
        ) &&
        policy.publisherId ===
          publisherId &&
        !policy.journalId &&
        policy.artworkType ===
          artworkType
    ) ?? null
  );
}


/*
 * Future-proofing:
 *
 * V2 also permits a publisher-wide AI rule
 * without an artworkType.
 *
 * We do not currently have such a rule in
 * the seed dataset, but the resolver should
 * already understand it.
 */

function findPublisherGeneralPolicy(
  publisherId: string
): AiPolicyRule | null {
  return (
    AI_POLICIES.find(
      (policy) =>
        isPolicyActive(
          policy
        ) &&
        policy.publisherId ===
          publisherId &&
        !policy.journalId &&
        !policy.artworkType
    ) ?? null
  );
}


/* =========================================================
   Public exact-ID resolution
   ========================================================= */

/*
 * ID-based resolution is the safest path
 * once the user has selected a result from
 * the journal search UI.
 *
 * No fuzzy matching occurs here.
 */

export function resolvePublicationTargetByIds(
  publisherId: string,
  journalId: string | undefined,
  artworkTypeInput: string
): ResolvedPublicationTarget {
  const artworkType =
    normalizeArtworkTypeV2(
      artworkTypeInput
    );

  const publisher =
    PUBLISHERS.find(
      (item) =>
        item.id ===
        publisherId &&
        item.active
    ) ?? null;

  const journal =
    journalId
      ? (
          JOURNALS.find(
            (item) =>
              item.id ===
                journalId &&
              item.active
          ) ?? null
        )
      : null;

  const warnings: string[] =
    [];


  /*
   * Invalid publisher.
   */

  if (
    !publisher
  ) {
    warnings.push(
      "The selected publisher is not present in the active CoverLab publication registry."
    );

    return {
      publisher:
        null,

      journal:
        null,

      artworkType,

      technicalProfile:
        null,

      aiPolicy:
        null,

      technicalOrigin:
        "none",

      policyOrigin:
        "none",

      requiresManualTechnicalCheck:
        true,

      requiresManualPolicyCheck:
        true,

      warnings,
    };
  }


  /*
   * Prevent a journal from accidentally being
   * resolved under the wrong publisher.
   */

  let validJournal =
    journal;

  if (
    validJournal &&
    validJournal.publisherId !==
      publisher.id
  ) {
    warnings.push(
      "The selected journal does not belong to the selected publisher. Journal-specific rules were not applied."
    );

    validJournal =
      null;
  }


  /*
   * Technical profile precedence:
   *
   * 1. journal + artwork
   * 2. publisher + artwork
   * 3. none
   */

  let technicalProfile:
    | PublicationTechnicalProfile
    | null =
    null;

  let technicalOrigin:
    ResolutionOrigin =
    "none";


  if (
    validJournal
  ) {
    technicalProfile =
      findJournalProfile(
        publisher.id,
        validJournal.id,
        artworkType
      );

    if (
      technicalProfile
    ) {
      technicalOrigin =
        "journal";
    }
  }


  if (
    !technicalProfile
  ) {
    technicalProfile =
      findPublisherProfile(
        publisher.id,
        artworkType
      );

    if (
      technicalProfile
    ) {
      technicalOrigin =
        "publisher";
    }
  }


  /*
   * AI policy precedence:
   *
   * 1. journal + artwork
   * 2. publisher + artwork
   * 3. publisher general
   * 4. none
   */

  let aiPolicy:
    | AiPolicyRule
    | null =
    null;

  let policyOrigin:
    ResolutionOrigin =
    "none";


  if (
    validJournal
  ) {
    aiPolicy =
      findJournalPolicy(
        publisher.id,
        validJournal.id,
        artworkType
      );

    if (
      aiPolicy
    ) {
      policyOrigin =
        "journal";
    }
  }


  if (
    !aiPolicy
  ) {
    aiPolicy =
      findPublisherArtworkPolicy(
        publisher.id,
        artworkType
      );

    if (
      aiPolicy
    ) {
      policyOrigin =
        "publisher";
    }
  }


  if (
    !aiPolicy
  ) {
    aiPolicy =
      findPublisherGeneralPolicy(
        publisher.id
      );

    if (
      aiPolicy
    ) {
      policyOrigin =
        "publisher";
    }
  }


  /*
   * Manual-check decisions.
   */

  const requiresManualTechnicalCheck =
    !technicalProfile ||
    technicalProfile.provenance
      .verificationStatus !==
      "verified";


  const requiresManualPolicyCheck =
    !aiPolicy ||
    aiPolicy.status ===
      "manual-check" ||
    aiPolicy.provenance
      .verificationStatus !==
      "verified";


  /*
   * User-facing warnings.
   *
   * These are intentionally factual and
   * conservative. They must not imply that
   * CoverLab guarantees journal acceptance.
   */

  if (
    !technicalProfile
  ) {
    warnings.push(
      validJournal
        ? "CoverLab does not yet have verified technical requirements for this journal and artwork type."
        : "CoverLab does not yet have verified technical requirements for this publisher and artwork type."
    );
  } else if (
    technicalOrigin ===
      "publisher" &&
    validJournal
  ) {
    warnings.push(
      "Technical requirements are currently based on verified publisher-level guidance. Check whether the selected journal provides stricter instructions."
    );
  }


  if (
    !aiPolicy
  ) {
    warnings.push(
      validJournal
        ? "CoverLab does not yet have a verified AI-image policy for this journal and artwork type."
        : "CoverLab does not yet have a verified AI-image policy for this publisher and artwork type."
    );
  } else if (
    policyOrigin ===
      "publisher" &&
    validJournal
  ) {
    warnings.push(
      "AI policy is currently based on publisher-level guidance. Journal-specific instructions may be stricter."
    );
  }


  if (
    aiPolicy?.status ===
      "not-allowed"
  ) {
    warnings.push(
      aiPolicy.message
    );
  }


  if (
    aiPolicy?.status ===
      "conditional"
  ) {
    warnings.push(
      aiPolicy.message
    );
  }


  return {
    publisher,

    journal:
      validJournal,

    artworkType,

    technicalProfile,

    aiPolicy,

    technicalOrigin,

    policyOrigin,

    requiresManualTechnicalCheck,

    requiresManualPolicyCheck,

    warnings:
      Array.from(
        new Set(
          warnings
        )
      ),
  };
}


/* =========================================================
   Name-based compatibility resolution
   ========================================================= */

/*
 * This function is useful during migration
 * because the current CoverLab UI stores
 * publisher and journal names.
 *
 * IMPORTANT:
 *
 * Name resolution here is EXACT normalized
 * name/alias resolution.
 *
 * It does NOT use fuzzy search.
 */

export function resolvePublicationTarget(
  publisherName: string,
  journalName: string,
  artworkTypeInput: string
): ResolvedPublicationTarget {
  const publisher =
    findPublisherByNameOrAlias(
      publisherName
    );

  const artworkType =
    normalizeArtworkTypeV2(
      artworkTypeInput
    );


  if (
    !publisher
  ) {
    return {
      publisher:
        null,

      journal:
        null,

      artworkType,

      technicalProfile:
        null,

      aiPolicy:
        null,

      technicalOrigin:
        "none",

      policyOrigin:
        "none",

      requiresManualTechnicalCheck:
        true,

      requiresManualPolicyCheck:
        true,

      warnings: [
        "The publisher could not be resolved exactly in the CoverLab publication registry.",
      ],
    };
  }


  const normalizedJournal =
    normalizePublicationText(
      journalName
    );


  /*
   * Empty journal is valid when the user is
   * intentionally working from publisher-level
   * guidance.
   */

  if (
    !normalizedJournal
  ) {
    return resolvePublicationTargetByIds(
      publisher.id,
      undefined,
      artworkType
    );
  }


  const journal =
    findJournalByNameOrAlias(
      journalName,
      publisher.id
    );


  if (
    !journal
  ) {
    const result =
      resolvePublicationTargetByIds(
        publisher.id,
        undefined,
        artworkType
      );

    return {
      ...result,

      warnings: [
        "The journal could not be resolved exactly. Publisher-level rules may be shown, but journal-specific verification is required.",

        ...result.warnings,
      ],

      requiresManualTechnicalCheck:
        true,

      requiresManualPolicyCheck:
        true,
    };
  }


  return resolvePublicationTargetByIds(
    publisher.id,
    journal.id,
    artworkType
  );
}


/* =========================================================
   Profile availability helpers
   ========================================================= */

export function hasVerifiedTechnicalProfile(
  journalId: string
) {
  return PUBLICATION_PROFILES.some(
    (profile) =>
      profile.version.active &&
      profile.journalId ===
        journalId &&
      profile.provenance
        .verificationStatus ===
        "verified"
  );
}


export function hasAnyTechnicalProfile(
  journalId: string
) {
  const journal =
    JOURNALS.find(
      (item) =>
        item.id ===
        journalId
    );

  if (
    !journal
  ) {
    return false;
  }


  /*
   * A journal has usable technical coverage
   * when either:
   *
   * - it has a journal-specific profile, or
   * - its publisher has an active
   *   publisher-level profile.
   */

  const journalSpecific =
    PUBLICATION_PROFILES.some(
      (profile) =>
        profile.version.active &&
        profile.journalId ===
          journal.id
    );


  if (
    journalSpecific
  ) {
    return true;
  }


  return PUBLICATION_PROFILES.some(
    (profile) =>
      profile.version.active &&
      profile.publisherId ===
        journal.publisherId &&
      !profile.journalId
  );
}