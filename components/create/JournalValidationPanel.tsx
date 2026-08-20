"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  normalizeArtworkType,
  resolvePublicationRules,
} from "../../lib/publicationRegistry";

type JournalValidationPanelProps = {
  image: string;

  publisher: string;

  journal: string;

  artworkType: string;
};

export default function JournalValidationPanel({
  image,
  publisher,
  journal,
  artworkType,
}: JournalValidationPanelProps) {
  const [
    sourceWidth,
    setSourceWidth,
  ] = useState(0);

  const [
    sourceHeight,
    setSourceHeight,
  ] = useState(0);

  useEffect(() => {
    const img =
      new Image();

    img.onload = () => {
      setSourceWidth(
        img.naturalWidth
      );

      setSourceHeight(
        img.naturalHeight
      );
    };

    img.src = image;
  }, [image]);

  const normalizedArtworkType =
    normalizeArtworkType(
      artworkType
    );

  const rules =
    resolvePublicationRules(
      publisher,
      journal,
      normalizedArtworkType
    );

  const {
    publisher:
      publisherRule,

    aiPolicy,

    exactProfile,

    confidence,

    requiresManualJournalCheck,
  } = rules;

  const requiresUpscale =
    Boolean(
      exactProfile &&
        sourceWidth &&
        sourceHeight &&
        (sourceWidth <
          exactProfile.widthPx ||
          sourceHeight <
            exactProfile.heightPx)
    );

  const sourceRatio =
    sourceWidth &&
    sourceHeight
      ? sourceWidth /
        sourceHeight
      : 0;

  const targetRatio =
    exactProfile
      ? exactProfile.widthPx /
        exactProfile.heightPx
      : 0;

  const ratioDifference =
    sourceRatio &&
    targetRatio
      ? Math.abs(
          sourceRatio -
            targetRatio
        ) / targetRatio
      : 0;

  const cropRequired =
    Boolean(
      exactProfile &&
        ratioDifference >
          0.02
    );

  const qualityRule =
    publisherRule
      ?.genericQuality;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
        Journal validation
      </p>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-white">
            {journal ||
              "Target journal"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {publisher ||
              "Unknown publisher"}{" "}
            ·{" "}
            {
              normalizedArtworkType
            }
          </p>
        </div>

        <RuleBadge
          confidence={
            confidence
          }
        />
      </div>

      <div className="mt-7 space-y-6">
        {/* AI POLICY */}
        <CheckSection
          title="AI policy"
        >
          <p
            className={`font-medium ${policyColor(
              aiPolicy.status
            )}`}
          >
            {policyLabel(
              aiPolicy.status
            )}
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {
              aiPolicy.message
            }
          </p>

          {aiPolicy
            .disclosureRequired ===
            true && (
            <div className="mt-3 inline-flex rounded-full border border-amber-300/20 bg-amber-300/[0.04] px-3 py-1.5 text-xs text-amber-200">
              Disclosure required
            </div>
          )}

          {aiPolicy.notes &&
            aiPolicy.notes
              .length > 0 && (
              <ul className="mt-4 space-y-2 text-xs leading-5 text-slate-500">
                {aiPolicy.notes.map(
                  (
                    note,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                    >
                      • {note}
                    </li>
                  )
                )}
              </ul>
            )}
        </CheckSection>

        {/* CURRENT ARTWORK */}
        <CheckSection
          title="Current artwork"
        >
          {sourceWidth &&
          sourceHeight ? (
            <p className="text-sm text-slate-200">
              {sourceWidth} ×{" "}
              {sourceHeight} px
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Reading image
              dimensions...
            </p>
          )}
        </CheckSection>

        {/* EXACT PROFILE */}
        {exactProfile ? (
          <>
            <CheckSection
              title="Verified target dimensions"
            >
              <p className="font-medium text-emerald-300">
                ✓ Exact profile
                available
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniStat
                  label="Pixels"
                  value={`${exactProfile.widthPx} × ${exactProfile.heightPx}`}
                />

                <MiniStat
                  label="Resolution"
                  value={`${exactProfile.dpi} dpi`}
                />

                {exactProfile.widthPhysical &&
                  exactProfile.heightPhysical && (
                    <MiniStat
                      label="Physical size"
                      value={`${exactProfile.widthPhysical} × ${exactProfile.heightPhysical}`}
                    />
                  )}

                <MiniStat
                  label="Formats"
                  value={exactProfile.formats.join(
                    ", "
                  )}
                />
              </div>

              {exactProfile
                .mastheadSafeAreaPx && (
                <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.03] p-4">
                  <p className="text-sm font-medium text-amber-200">
                    Masthead safe
                    zone
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    The top{" "}
                    {
                      exactProfile.mastheadSafeAreaPx
                    }{" "}
                    px of the final
                    export may be
                    obscured by the
                    journal masthead.
                  </p>
                </div>
              )}

              {exactProfile.notes
                .length > 0 && (
                <ul className="mt-4 space-y-2 text-xs leading-5 text-slate-500">
                  {exactProfile.notes.map(
                    (
                      note,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        • {note}
                      </li>
                    )
                  )}
                </ul>
              )}
            </CheckSection>

            <CheckSection
              title="Resolution quality"
            >
              {requiresUpscale ? (
                <>
                  <p className="font-medium text-amber-300">
                    ⚠ Upscaling
                    required
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The selected
                    artwork is smaller
                    than the verified
                    publication target.
                    Simply changing
                    DPI metadata is
                    not sufficient.
                  </p>
                </>
              ) : (
                <p className="font-medium text-emerald-300">
                  ✓ Native pixel
                  dimensions are
                  sufficient
                </p>
              )}
            </CheckSection>

            <CheckSection
              title="Aspect ratio"
            >
              {cropRequired ? (
                <>
                  <p className="font-medium text-amber-300">
                    ⚠ Controlled crop
                    required
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The native artwork
                    ratio differs from
                    the verified
                    publication ratio.
                    Crop approval is
                    required before
                    export.
                  </p>
                </>
              ) : (
                <p className="font-medium text-emerald-300">
                  ✓ Good aspect-ratio
                  match
                </p>
              )}
            </CheckSection>
          </>
        ) : (
          <CheckSection
            title="Exact dimensions"
          >
            <p className="font-medium text-amber-300">
              Journal-specific
              verification required
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              CoverLab currently has
              publisher-level policy
              support for this target,
              but no verified exact
              size profile for this
              journal/artwork
              combination.
            </p>

            {qualityRule?.dpi && (
              <p className="mt-3 text-xs text-slate-500">
                Publisher-level
                guidance currently
                suggests around{" "}
                {
                  qualityRule.dpi
                }{" "}
                dpi, but this must
                not be treated as the
                journal&apos;s exact
                requirement.
              </p>
            )}
          </CheckSection>
        )}

        {/* RULE SOURCE LEVEL */}
        <CheckSection
          title="Rule source"
        >
          <p className="text-sm text-slate-300">
            {confidenceLabel(
              confidence
            )}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Policy last checked:{" "}
            {
              aiPolicy.verifiedOn
            }
          </p>
        </CheckSection>

        {/* OVERALL STATUS */}
        <div
          className={`rounded-xl border p-5 ${overallBoxClass(
            aiPolicy.status
          )}`}
        >
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Current status
          </p>

          <p className="mt-3 text-lg font-medium text-white">
            {overallStatus({
              policy:
                aiPolicy.status,

              hasExactProfile:
                Boolean(
                  exactProfile
                ),

              requiresUpscale,

              cropRequired,

              requiresManualJournalCheck,
            })}
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {overallExplanation({
              policy:
                aiPolicy.status,

              hasExactProfile:
                Boolean(
                  exactProfile
                ),
            })}
          </p>
        </div>

        {/* DISCLAIMER */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs leading-5 text-slate-500">
            CoverLab validation is
            guidance based on the
            latest rules stored in
            the publication registry.
            Publisher and journal
            policies can change.
            Final submission should
            always be checked against
            the journal&apos;s current
            author instructions.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckSection({
  title,
  children,
}: {
  title: string;

  children:
    React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 pb-6">
      <p className="text-xs uppercase tracking-widest text-slate-500">
        {title}
      </p>

      <div className="mt-3">
        {children}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

function RuleBadge({
  confidence,
}: {
  confidence:
    | "verified-journal"
    | "verified-publisher"
    | "fallback";
}) {
  if (
    confidence ===
    "verified-journal"
  ) {
    return (
      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-1.5 text-xs text-emerald-300">
        ✓ Journal rule
      </span>
    );
  }

  if (
    confidence ===
    "verified-publisher"
  ) {
    return (
      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs text-cyan-300">
        ~ Publisher rule
      </span>
    );
  }

  return (
    <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-3 py-1.5 text-xs text-amber-300">
      ⚠ Manual check
    </span>
  );
}

function policyColor(
  status:
    | "allowed"
    | "conditional"
    | "not-allowed"
    | "manual-check"
) {
  if (
    status ===
    "allowed"
  ) {
    return "text-emerald-300";
  }

  if (
    status ===
    "not-allowed"
  ) {
    return "text-red-300";
  }

  return "text-amber-300";
}

function policyLabel(
  status:
    | "allowed"
    | "conditional"
    | "not-allowed"
    | "manual-check"
) {
  if (
    status ===
    "allowed"
  ) {
    return "✓ Currently permitted";
  }

  if (
    status ===
    "not-allowed"
  ) {
    return "✕ Currently not permitted";
  }

  if (
    status ===
    "conditional"
  ) {
    return "⚠ Conditionally permitted";
  }

  return "⚠ Manual verification required";
}

function confidenceLabel(
  confidence:
    | "verified-journal"
    | "verified-publisher"
    | "fallback"
) {
  if (
    confidence ===
    "verified-journal"
  ) {
    return "Verified journal-specific rule";
  }

  if (
    confidence ===
    "verified-publisher"
  ) {
    return "Verified publisher-level rule";
  }

  return "No verified stored rule";
}

function overallStatus({
  policy,
  hasExactProfile,
  requiresUpscale,
  cropRequired,
  requiresManualJournalCheck,
}: {
  policy:
    | "allowed"
    | "conditional"
    | "not-allowed"
    | "manual-check";

  hasExactProfile: boolean;

  requiresUpscale: boolean;

  cropRequired: boolean;

  requiresManualJournalCheck: boolean;
}) {
  if (
    policy ===
    "not-allowed"
  ) {
    return "NOT ELIGIBLE FOR PUBLICATION-READY EXPORT";
  }

  if (
    requiresManualJournalCheck ||
    !hasExactProfile
  ) {
    return "MANUAL JOURNAL CHECK REQUIRED";
  }

  if (
    policy ===
      "conditional" ||
    requiresUpscale ||
    cropRequired
  ) {
    return "READY WITH ATTENTION";
  }

  return "VALIDATION PASSED";
}

function overallExplanation({
  policy,
  hasExactProfile,
}: {
  policy:
    | "allowed"
    | "conditional"
    | "not-allowed"
    | "manual-check";

  hasExactProfile: boolean;
}) {
  if (
    policy ===
    "not-allowed"
  ) {
    return "You may still use the artwork as an internal draft or design reference, but CoverLab should not label it publication-ready for this submission type.";
  }

  if (
    !hasExactProfile
  ) {
    return "The AI policy may be known at publisher level, but exact dimensions and submission requirements still need journal-specific verification.";
  }

  if (
    policy ===
    "conditional"
  ) {
    return "The artwork may be usable, but disclosure, editorial permission or other conditions must be satisfied.";
  }

  return "No blocking policy issue is currently stored for this target, subject to final scientific and journal checks.";
}

function overallBoxClass(
  status:
    | "allowed"
    | "conditional"
    | "not-allowed"
    | "manual-check"
) {
  if (
    status ===
    "not-allowed"
  ) {
    return "border-red-400/20 bg-red-400/[0.04]";
  }

  if (
    status ===
    "allowed"
  ) {
    return "border-cyan-400/20 bg-cyan-400/[0.04]";
  }

  return "border-amber-300/20 bg-amber-300/[0.03]";
}