import type {
  AiPolicyRule,
  PublicationTechnicalProfile,
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
  PUBLICATION_SOURCES,
} from "./sources";


export type RegistryIntegrityIssue = {
  level:
    | "error"
    | "warning";

  code: string;

  message: string;

  recordId?: string;
};


export type RegistryIntegrityReport = {
  valid: boolean;

  errors: RegistryIntegrityIssue[];

  warnings: RegistryIntegrityIssue[];

  summary: {
    publishers: number;

    journals: number;

    profiles: number;

    aiPolicies: number;

    sources: number;

    errorCount: number;

    warningCount: number;
  };
};


/* =========================================================
   Public API
   ========================================================= */

export function validatePublicationRegistry(): RegistryIntegrityReport {
  const issues: RegistryIntegrityIssue[] =
    [];

  validatePublisherIds(
    issues
  );

  validateJournalRelationships(
    issues
  );

  validateSourceRelationships(
    issues
  );

  validateProfileRelationships(
    issues
  );

  validatePolicyRelationships(
    issues
  );

  validateDuplicateActiveProfiles(
    issues
  );

  validateDuplicateActivePolicies(
    issues
  );

  validateProfileDimensions(
    issues
  );

  validateProfileProvenance(
    issues
  );

  validatePolicyProvenance(
    issues
  );

  const errors =
    issues.filter(
      (issue) =>
        issue.level ===
        "error"
    );

  const warnings =
    issues.filter(
      (issue) =>
        issue.level ===
        "warning"
    );

  return {
    valid:
      errors.length ===
      0,

    errors,

    warnings,

    summary: {
      publishers:
        PUBLISHERS.length,

      journals:
        JOURNALS.length,

      profiles:
        PUBLICATION_PROFILES.length,

      aiPolicies:
        AI_POLICIES.length,

      sources:
        PUBLICATION_SOURCES.length,

      errorCount:
        errors.length,

      warningCount:
        warnings.length,
    },
  };
}


/* =========================================================
   Publisher checks
   ========================================================= */

function validatePublisherIds(
  issues: RegistryIntegrityIssue[]
) {
  const seen =
    new Set<string>();

  for (
    const publisher of
    PUBLISHERS
  ) {
    if (
      seen.has(
        publisher.id
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "duplicate-publisher-id",

        recordId:
          publisher.id,

        message:
          `Duplicate publisher ID: ${publisher.id}`,
      });
    }

    seen.add(
      publisher.id
    );

    if (
      !publisher.name.trim()
    ) {
      issues.push({
        level:
          "error",

        code:
          "publisher-name-empty",

        recordId:
          publisher.id,

        message:
          `Publisher ${publisher.id} has an empty name.`,
      });
    }
  }
}


/* =========================================================
   Journal checks
   ========================================================= */

function validateJournalRelationships(
  issues: RegistryIntegrityIssue[]
) {
  const seen =
    new Set<string>();

  const publisherIds =
    new Set(
      PUBLISHERS.map(
        (publisher) =>
          publisher.id
      )
    );

  for (
    const journal of
    JOURNALS
  ) {
    if (
      seen.has(
        journal.id
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "duplicate-journal-id",

        recordId:
          journal.id,

        message:
          `Duplicate journal ID: ${journal.id}`,
      });
    }

    seen.add(
      journal.id
    );

    if (
      !publisherIds.has(
        journal.publisherId
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "journal-publisher-missing",

        recordId:
          journal.id,

        message:
          `Journal ${journal.name} points to missing publisher ${journal.publisherId}.`,
      });
    }

    if (
      !journal.name.trim()
    ) {
      issues.push({
        level:
          "error",

        code:
          "journal-name-empty",

        recordId:
          journal.id,

        message:
          `Journal ${journal.id} has an empty name.`,
      });
    }
  }
}


/* =========================================================
   Source checks
   ========================================================= */

function validateSourceRelationships(
  issues: RegistryIntegrityIssue[]
) {
  const seen =
    new Set<string>();

  const publisherIds =
    new Set(
      PUBLISHERS.map(
        (publisher) =>
          publisher.id
      )
    );

  const journalIds =
    new Set(
      JOURNALS.map(
        (journal) =>
          journal.id
      )
    );

  for (
    const source of
    PUBLICATION_SOURCES
  ) {
    if (
      seen.has(
        source.id
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "duplicate-source-id",

        recordId:
          source.id,

        message:
          `Duplicate source ID: ${source.id}`,
      });
    }

    seen.add(
      source.id
    );

    if (
      source.publisherId &&
      !publisherIds.has(
        source.publisherId
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "source-publisher-missing",

        recordId:
          source.id,

        message:
          `Source ${source.id} points to missing publisher ${source.publisherId}.`,
      });
    }

    if (
      source.journalId &&
      !journalIds.has(
        source.journalId
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "source-journal-missing",

        recordId:
          source.id,

        message:
          `Source ${source.id} points to missing journal ${source.journalId}.`,
      });
    }

    if (
      !source.url.trim()
    ) {
      issues.push({
        level:
          "error",

        code:
          "source-url-empty",

        recordId:
          source.id,

        message:
          `Source ${source.id} has an empty URL.`,
      });
    }

    if (
      !source.accessedOn.trim()
    ) {
      issues.push({
        level:
          "warning",

        code:
          "source-access-date-missing",

        recordId:
          source.id,

        message:
          `Source ${source.id} does not have an accessedOn date.`,
      });
    }
  }
}


/* =========================================================
   Profile relationship checks
   ========================================================= */

function validateProfileRelationships(
  issues: RegistryIntegrityIssue[]
) {
  const publisherIds =
    new Set(
      PUBLISHERS.map(
        (publisher) =>
          publisher.id
      )
    );

  const journalIds =
    new Set(
      JOURNALS.map(
        (journal) =>
          journal.id
      )
    );

  const profileIds =
    new Set<string>();

  for (
    const profile of
    PUBLICATION_PROFILES
  ) {
    if (
      profileIds.has(
        profile.id
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "duplicate-profile-id",

        recordId:
          profile.id,

        message:
          `Duplicate technical profile ID: ${profile.id}`,
      });
    }

    profileIds.add(
      profile.id
    );

    if (
      !publisherIds.has(
        profile.publisherId
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "profile-publisher-missing",

        recordId:
          profile.id,

        message:
          `Profile ${profile.id} points to missing publisher ${profile.publisherId}.`,
      });
    }

    if (
      profile.journalId &&
      !journalIds.has(
        profile.journalId
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "profile-journal-missing",

        recordId:
          profile.id,

        message:
          `Profile ${profile.id} points to missing journal ${profile.journalId}.`,
      });
    }

    if (
      profile.journalId
    ) {
      const journal =
        JOURNALS.find(
          (item) =>
            item.id ===
            profile.journalId
        );

      if (
        journal &&
        journal.publisherId !==
          profile.publisherId
      ) {
        issues.push({
          level:
            "error",

          code:
            "profile-journal-publisher-mismatch",

          recordId:
            profile.id,

          message:
            `Profile ${profile.id} uses journal ${journal.id}, but the journal belongs to publisher ${journal.publisherId}, not ${profile.publisherId}.`,
        });
      }
    }
  }
}


/* =========================================================
   Policy relationship checks
   ========================================================= */

function validatePolicyRelationships(
  issues: RegistryIntegrityIssue[]
) {
  const publisherIds =
    new Set(
      PUBLISHERS.map(
        (publisher) =>
          publisher.id
      )
    );

  const journalIds =
    new Set(
      JOURNALS.map(
        (journal) =>
          journal.id
      )
    );

  const policyIds =
    new Set<string>();

  for (
    const policy of
    AI_POLICIES
  ) {
    if (
      policyIds.has(
        policy.id
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "duplicate-policy-id",

        recordId:
          policy.id,

        message:
          `Duplicate AI policy ID: ${policy.id}`,
      });
    }

    policyIds.add(
      policy.id
    );

    if (
      !publisherIds.has(
        policy.publisherId
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "policy-publisher-missing",

        recordId:
          policy.id,

        message:
          `Policy ${policy.id} points to missing publisher ${policy.publisherId}.`,
      });
    }

    if (
      policy.journalId &&
      !journalIds.has(
        policy.journalId
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "policy-journal-missing",

        recordId:
          policy.id,

        message:
          `Policy ${policy.id} points to missing journal ${policy.journalId}.`,
      });
    }

    if (
      policy.journalId
    ) {
      const journal =
        JOURNALS.find(
          (item) =>
            item.id ===
            policy.journalId
        );

      if (
        journal &&
        journal.publisherId !==
          policy.publisherId
      ) {
        issues.push({
          level:
            "error",

          code:
            "policy-journal-publisher-mismatch",

          recordId:
            policy.id,

          message:
            `Policy ${policy.id} uses journal ${journal.id}, but the journal belongs to publisher ${journal.publisherId}, not ${policy.publisherId}.`,
        });
      }
    }
  }
}


/* =========================================================
   Duplicate active technical rules
   ========================================================= */

function validateDuplicateActiveProfiles(
  issues: RegistryIntegrityIssue[]
) {
  const activeProfiles =
    PUBLICATION_PROFILES.filter(
      (profile) =>
        profile.version.active
    );

  const groups =
    new Map<
      string,
      PublicationTechnicalProfile[]
    >();

  for (
    const profile of
    activeProfiles
  ) {
    const key =
      [
        profile.publisherId,

        profile.journalId ??
          "__publisher__",

        profile.artworkType,
      ].join(
        "::"
      );

    const current =
      groups.get(
        key
      ) ?? [];

    current.push(
      profile
    );

    groups.set(
      key,
      current
    );
  }

  for (
    const [
      key,
      profiles,
    ] of
    groups
  ) {
    if (
      profiles.length >
      1
    ) {
      issues.push({
        level:
          "error",

        code:
          "multiple-active-profiles",

        message:
          `Multiple active technical profiles exist for the same scope: ${key}. Profiles: ${profiles
            .map(
              (profile) =>
                profile.id
            )
            .join(
              ", "
            )}`,
      });
    }
  }
}


/* =========================================================
   Duplicate active AI policy rules
   ========================================================= */

function validateDuplicateActivePolicies(
  issues: RegistryIntegrityIssue[]
) {
  const activePolicies =
    AI_POLICIES.filter(
      (policy) =>
        policy.version.active
    );

  const groups =
    new Map<
      string,
      AiPolicyRule[]
    >();

  for (
    const policy of
    activePolicies
  ) {
    const key =
      [
        policy.publisherId,

        policy.journalId ??
          "__publisher__",

        policy.artworkType ??
          "__general__",

        [...policy.aiUseTypes]
          .sort()
          .join(
            "+"
          ),
      ].join(
        "::"
      );

    const current =
      groups.get(
        key
      ) ?? [];

    current.push(
      policy
    );

    groups.set(
      key,
      current
    );
  }

  for (
    const [
      key,
      policies,
    ] of
    groups
  ) {
    if (
      policies.length >
      1
    ) {
      issues.push({
        level:
          "error",

        code:
          "multiple-active-ai-policies",

        message:
          `Multiple active AI policies exist for the same scope/use set: ${key}. Policies: ${policies
            .map(
              (policy) =>
                policy.id
            )
            .join(
              ", "
            )}`,
      });
    }
  }
}


/* =========================================================
   Dimension sanity checks
   ========================================================= */

function validateProfileDimensions(
  issues: RegistryIntegrityIssue[]
) {
  for (
    const profile of
    PUBLICATION_PROFILES
  ) {
    const dimensions =
      profile.dimensions;

    if (
      !dimensions
    ) {
      continue;
    }

    const numericValues = [
      dimensions.widthPx,
      dimensions.heightPx,
      dimensions.minimumWidthPx,
      dimensions.minimumHeightPx,
      dimensions.maximumWidthPx,
      dimensions.maximumHeightPx,
    ].filter(
      (
        value
      ): value is number =>
        value !==
        undefined
    );

    if (
      numericValues.some(
        (value) =>
          value <= 0
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "invalid-profile-dimension",

        recordId:
          profile.id,

        message:
          `Profile ${profile.id} contains a non-positive pixel dimension.`,
      });
    }

    if (
      dimensions.mode ===
        "exact" &&
      (
        !dimensions.widthPx ||
        !dimensions.heightPx
      )
    ) {
      issues.push({
        level:
          "error",

        code:
          "exact-dimensions-incomplete",

        recordId:
          profile.id,

        message:
          `Exact-dimension profile ${profile.id} must define both widthPx and heightPx.`,
      });
    }

    if (
      dimensions.mode ===
        "minimum" &&
      (
        !dimensions.minimumWidthPx ||
        !dimensions.minimumHeightPx
      )
    ) {
      issues.push({
        level:
          "warning",

        code:
          "minimum-dimensions-incomplete",

        recordId:
          profile.id,

        message:
          `Minimum-dimension profile ${profile.id} does not define both minimum width and height.`,
      });
    }

    if (
      dimensions.mode ===
        "maximum" &&
      (
        !dimensions.maximumWidthPx ||
        !dimensions.maximumHeightPx
      )
    ) {
      issues.push({
        level:
          "warning",

        code:
          "maximum-dimensions-incomplete",

        recordId:
          profile.id,

        message:
          `Maximum-dimension profile ${profile.id} does not define both maximum width and height.`,
      });
    }
  }
}


/* =========================================================
   Profile provenance checks
   ========================================================= */

function validateProfileProvenance(
  issues: RegistryIntegrityIssue[]
) {
  const sourceIds =
    new Set(
      PUBLICATION_SOURCES.map(
        (source) =>
          source.id
      )
    );

  for (
    const profile of
    PUBLICATION_PROFILES
  ) {
    if (
      profile.provenance
        .sourceIds.length ===
      0
    ) {
      issues.push({
        level:
          "error",

        code:
          "profile-source-missing",

        recordId:
          profile.id,

        message:
          `Profile ${profile.id} has no provenance source.`,
      });
    }

    for (
      const sourceId of
      profile.provenance
        .sourceIds
    ) {
      if (
        !sourceIds.has(
          sourceId
        )
      ) {
        issues.push({
          level:
            "error",

          code:
            "profile-source-invalid",

          recordId:
            profile.id,

          message:
            `Profile ${profile.id} references missing source ${sourceId}.`,
        });
      }
    }

    if (
      !profile.provenance
        .verifiedOn
    ) {
      issues.push({
        level:
          "warning",

        code:
          "profile-verification-date-missing",

        recordId:
          profile.id,

        message:
          `Profile ${profile.id} does not have a verification date.`,
      });
    }
  }
}


/* =========================================================
   AI policy provenance checks
   ========================================================= */

function validatePolicyProvenance(
  issues: RegistryIntegrityIssue[]
) {
  const sourceIds =
    new Set(
      PUBLICATION_SOURCES.map(
        (source) =>
          source.id
      )
    );

  for (
    const policy of
    AI_POLICIES
  ) {
    if (
      policy.provenance
        .sourceIds.length ===
      0
    ) {
      issues.push({
        level:
          "error",

        code:
          "policy-source-missing",

        recordId:
          policy.id,

        message:
          `AI policy ${policy.id} has no provenance source.`,
      });
    }

    for (
      const sourceId of
      policy.provenance
        .sourceIds
    ) {
      if (
        !sourceIds.has(
          sourceId
        )
      ) {
        issues.push({
          level:
            "error",

          code:
            "policy-source-invalid",

          recordId:
            policy.id,

          message:
            `AI policy ${policy.id} references missing source ${sourceId}.`,
        });
      }
    }

    if (
      !policy.provenance
        .verifiedOn
    ) {
      issues.push({
        level:
          "warning",

        code:
          "policy-verification-date-missing",

        recordId:
          policy.id,

        message:
          `AI policy ${policy.id} does not have a verification date.`,
      });
    }
  }
}