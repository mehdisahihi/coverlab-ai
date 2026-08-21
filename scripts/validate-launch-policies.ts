import {
  enforceAiOperation,
  resolvePublicationTarget,
  validatePublicationRegistry,
  type AiUseType,
} from "../lib/publications";

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(
  actual: T,
  expected: T,
  message: string
) {
  if (actual !== expected) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`
    );
  }
}

const aiOperations: AiUseType[] = [
  "generative-creation",
  "generative-refinement",
  "detail-enhancement",
];

function validateRegistry() {
  const report =
    validatePublicationRegistry();

  assert(
    report.valid,
    `Publication registry integrity failed:\n${JSON.stringify(report, null, 2)}`
  );

  assertEqual(
    report.summary.errorCount,
    0,
    "Registry must contain zero integrity errors."
  );

  assertEqual(
    report.summary.warningCount,
    0,
    "Registry must contain zero integrity warnings."
  );

  console.log("✓ Publication registry integrity");
}

function validateLangmuirCover() {
  const resolved =
    resolvePublicationTarget(
      "American Chemical Society",
      "Langmuir",
      "Front Cover"
    );

  assert(
    resolved.publisher,
    "Langmuir publisher must resolve."
  );

  assert(
    resolved.journal,
    "Langmuir journal must resolve."
  );

  assertEqual(
    resolved.artworkType,
    "Front Cover",
    "Journal Cover must remain internally normalized to Front Cover."
  );

  assert(
    resolved.technicalProfile,
    "Langmuir Front Cover must have a technical profile."
  );

  assertEqual(
    resolved.technicalProfile.dimensions?.widthPx,
    2457,
    "Langmuir cover width must remain 2457 px."
  );

  assertEqual(
    resolved.technicalProfile.dimensions?.heightPx,
    3000,
    "Langmuir cover height must remain 3000 px."
  );

  assertEqual(
    resolved.technicalOrigin,
    "journal",
    "Langmuir technical requirements must resolve at journal level."
  );

  for (const aiUseType of aiOperations) {
    const decision =
      enforceAiOperation({
        publisher:
          "American Chemical Society",
        journal:
          "Langmuir",
        artworkType:
          "Front Cover",
        aiUseType,
      });

    assertEqual(
      decision.status,
      "conditional",
      `Langmuir ${aiUseType} must remain conditional.`
    );

    assertEqual(
      decision.allowed,
      true,
      `Langmuir ${aiUseType} must remain executable subject to conditions.`
    );

    assertEqual(
      decision.disclosureRequired,
      true,
      `Langmuir ${aiUseType} must continue to require disclosure.`
    );
  }

  console.log("✓ Langmuir Journal Cover policy and profile");
}

function validateElsevierGraphicalAbstract() {
  const resolved =
    resolvePublicationTarget(
      "Elsevier",
      "Applied Energy",
      "Graphical Abstract"
    );

  assert(
    resolved.publisher,
    "Elsevier publisher must resolve."
  );

  assert(
    resolved.journal,
    "Applied Energy must resolve."
  );

  assert(
    resolved.aiPolicy,
    "Elsevier Graphical Abstract AI policy must resolve."
  );

  assertEqual(
    resolved.aiPolicy.status,
    "manual-check",
    "Elsevier Graphical Abstract must remain manual-check."
  );

  assertEqual(
    resolved.policyOrigin,
    "publisher",
    "Elsevier Graphical Abstract AI policy must remain publisher-level guidance."
  );

  for (const aiUseType of aiOperations) {
    const withoutConfirmation =
      enforceAiOperation({
        publisher:
          "Elsevier",
        journal:
          "Applied Energy",
        artworkType:
          "Graphical Abstract",
        aiUseType,
        manualPolicyConfirmed:
          false,
      });

    assertEqual(
      withoutConfirmation.status,
      "manual-check",
      `Elsevier GA ${aiUseType} status must remain manual-check before acknowledgement.`
    );

    assertEqual(
      withoutConfirmation.allowed,
      false,
      `Elsevier GA ${aiUseType} must be blocked before acknowledgement.`
    );

    const withConfirmation =
      enforceAiOperation({
        publisher:
          "Elsevier",
        journal:
          "Applied Energy",
        artworkType:
          "Graphical Abstract",
        aiUseType,
        manualPolicyConfirmed:
          true,
      });

    assertEqual(
      withConfirmation.status,
      "manual-check",
      `Elsevier GA ${aiUseType} status must remain manual-check after acknowledgement.`
    );

    assertEqual(
      withConfirmation.allowed,
      true,
      `Elsevier GA ${aiUseType} must be executable after explicit author acknowledgement.`
    );
  }

  console.log("✓ Elsevier Graphical Abstract manual-check gate");
}

function validateUnknownPublicationFallback() {
  for (const aiUseType of aiOperations) {
    const withoutConfirmation =
      enforceAiOperation({
        publisher:
          "Unknown Publisher",
        journal:
          "Unknown Journal",
        artworkType:
          "Graphical Abstract",
        aiUseType,
      });

    assertEqual(
      withoutConfirmation.status,
      "manual-check",
      `Unknown publication ${aiUseType} must resolve to manual-check.`
    );

    assertEqual(
      withoutConfirmation.allowed,
      false,
      `Unknown publication ${aiUseType} must be blocked before manual verification.`
    );

    const withConfirmation =
      enforceAiOperation({
        publisher:
          "Unknown Publisher",
        journal:
          "Unknown Journal",
        artworkType:
          "Graphical Abstract",
        aiUseType,
        manualPolicyConfirmed:
          true,
      });

    assertEqual(
      withConfirmation.status,
      "manual-check",
      `Unknown publication ${aiUseType} must remain manual-check after verification.`
    );

    assertEqual(
      withConfirmation.allowed,
      true,
      `Unknown publication ${aiUseType} may execute only after explicit manual verification.`
    );
  }

  console.log("✓ Unknown-publication manual fallback");
}

validateRegistry();
validateLangmuirCover();
validateElsevierGraphicalAbstract();
validateUnknownPublicationFallback();

console.log("\nAll launch policy regression checks passed.");
