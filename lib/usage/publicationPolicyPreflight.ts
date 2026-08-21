import {
  enforceAiOperation,
} from "@/lib/publications/enforcement";

export function publicationPolicyPreflight(
  args: {
    publisher?: string;
    journal?: string;
    artworkType?: string;
    manualPolicyConfirmed?: boolean;
    aiUseType:
      | "generative-creation"
      | "generative-refinement"
      | "detail-enhancement";
  }
) {
  const decision =
    enforceAiOperation({
      publisher:
        args.publisher ?? "",
      journal:
        args.journal ?? "",
      artworkType:
        args.artworkType ?? "",
      aiUseType:
        args.aiUseType,
      manualPolicyConfirmed:
        args.manualPolicyConfirmed ??
        false,
    });

  if (decision.allowed) {
    return null;
  }

  return Response.json(
    {
      error:
        decision.message,
      code:
        decision.status ===
        "not-allowed"
          ? "AI_POLICY_NOT_ALLOWED"
          : "AI_POLICY_MANUAL_CHECK_REQUIRED",
      policy: {
        status:
          decision.status,
        aiUseType:
          decision.aiUseType,
        message:
          decision.message,
        disclosureRequired:
          decision.disclosureRequired,
        disclosureInstructions:
          decision.disclosureInstructions,
        conditions:
          decision.conditions,
      },
    },
    {
      status:
        decision.status ===
        "not-allowed"
          ? 403
          : 409,
    }
  );
}
