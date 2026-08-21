import type {
  AiPolicyRule,
  AiPolicyStatus,
  AiUseType,
  ResolvedPublicationTarget,
} from "./types";

import {
  resolvePublicationTarget,
} from "./resolver";

export type AiEnforcementDecision = {
  allowed: boolean;

  status: AiPolicyStatus;

  aiUseType: AiUseType;

  message: string;

  disclosureRequired:
    | boolean
    | null;

  disclosureInstructions?:
    | string;

  conditions: string[];

  policy:
    | AiPolicyRule
    | null;

  resolved:
    ResolvedPublicationTarget;
};

type EnforceAiOperationInput = {
  publisher: string;

  journal: string;

  artworkType: string;

  aiUseType: AiUseType;

  /*
   * manual-check policies are intentionally
   * blocked unless the user has explicitly
   * confirmed that they independently checked
   * the relevant publication requirements.
   */
  manualPolicyConfirmed?: boolean;
};

export function enforceAiOperation({
  publisher,
  journal,
  artworkType,
  aiUseType,
  manualPolicyConfirmed = false,
}: EnforceAiOperationInput): AiEnforcementDecision {
  const resolved =
    resolvePublicationTarget(
      publisher,
      journal,
      artworkType
    );

  const policy =
    resolved.aiPolicy;

  /*
   * No verified policy means CoverLab must
   * not silently assume AI use is permitted.
   */

  if (!policy) {
    return {
      allowed:
        manualPolicyConfirmed,

      status:
        "manual-check",

      aiUseType,

      message:
        manualPolicyConfirmed
          ? "No applicable verified AI policy was found. The user confirmed an independent manual policy check."
          : "CoverLab does not have an applicable verified AI policy for this publication and AI operation. Manual verification is required before using generative AI.",

      disclosureRequired:
        null,

      conditions: [],

      policy: null,

      resolved,
    };
  }

  /*
   * A policy may apply only to particular
   * categories of AI use.
   *
   * Never apply a rule for one AI operation
   * to a different operation.
   */

  const applies =
    policy.aiUseTypes.includes(
      aiUseType
    ) ||
    policy.aiUseTypes.includes(
      "unknown"
    );

  if (!applies) {
    return {
      allowed:
        manualPolicyConfirmed,

      status:
        "manual-check",

      aiUseType,

      message:
        manualPolicyConfirmed
          ? `The available AI policy does not explicitly cover ${aiUseType}. The user confirmed an independent manual policy check.`
          : `The available AI policy does not explicitly cover ${aiUseType}. Manual verification is required before this AI operation.`,

      disclosureRequired:
        null,

      conditions: [],

      policy,

      resolved,
    };
  }

  switch (policy.status) {
    case "allowed":
      return {
        allowed: true,

        status:
          "allowed",

        aiUseType,

        message:
          policy.message,

        disclosureRequired:
          policy.disclosure
            .required,

        disclosureInstructions:
          policy.disclosure
            .instructions,

        conditions:
          policy.conditions ??
          [],

        policy,

        resolved,
      };

    case "conditional":
      return {
        allowed: true,

        status:
          "conditional",

        aiUseType,

        message:
          policy.message,

        disclosureRequired:
          policy.disclosure
            .required,

        disclosureInstructions:
          policy.disclosure
            .instructions,

        conditions:
          policy.conditions ??
          [],

        policy,

        resolved,
      };

    case "not-allowed":
      return {
        allowed: false,

        status:
          "not-allowed",

        aiUseType,

        message:
          policy.message,

        disclosureRequired:
          policy.disclosure
            .required,

        disclosureInstructions:
          policy.disclosure
            .instructions,

        conditions:
          policy.conditions ??
          [],

        policy,

        resolved,
      };

    case "manual-check":
    default:
      return {
        allowed:
          manualPolicyConfirmed,

        status:
          "manual-check",

        aiUseType,

        message:
          manualPolicyConfirmed
            ? `${policy.message} The user confirmed an independent manual policy check.`
            : policy.message,

        disclosureRequired:
          policy.disclosure
            .required,

        disclosureInstructions:
          policy.disclosure
            .instructions,

        conditions:
          policy.conditions ??
          [],

        policy,

        resolved,
      };
  }
}
