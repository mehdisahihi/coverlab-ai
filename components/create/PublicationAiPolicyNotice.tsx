"use client";

import type {
  ClientPolicyDecision,
} from "./usePublicationAiPolicy";

type PublicationAiPolicyNoticeProps = {
  policy:
    ClientPolicyDecision | null;

  loading?:
    boolean;

  error?:
    string;

  operationLabel:
    string;

  compact?:
    boolean;
};

export default function PublicationAiPolicyNotice({
  policy,
  loading = false,
  error = "",
  operationLabel,
  compact = false,
}: PublicationAiPolicyNoticeProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-slate-400">
          Checking publication AI policy…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4">
        <p className="text-sm font-medium text-amber-100">
          Policy check unavailable
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {error}
        </p>
      </div>
    );
  }

  if (!policy) {
    return null;
  }

  const blocked =
    !policy.allowed;

  const conditional =
    policy.status ===
    "conditional";

  const statusLabel =
    policy.status ===
    "allowed"
      ? "Allowed"
      : policy.status ===
          "conditional"
        ? "Allowed with conditions"
        : policy.status ===
            "not-allowed"
          ? "Not allowed"
          : "Manual verification required";

  const borderClass =
    blocked
      ? "border-red-400/20 bg-red-400/[0.05]"
      : conditional
        ? "border-amber-300/20 bg-amber-300/[0.04]"
        : "border-emerald-400/20 bg-emerald-400/[0.04]";

  const headingClass =
    blocked
      ? "text-red-200"
      : conditional
        ? "text-amber-100"
        : "text-emerald-200";

  return (
    <div
      className={`rounded-xl border ${borderClass} ${
        compact
          ? "p-4"
          : "p-5"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className={`text-sm font-medium ${headingClass}`}
          >
            {statusLabel}
          </p>

          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
            {operationLabel}
          </p>
        </div>

        {policy.provenance && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            {
              policy.provenance
                .verificationStatus
            }
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        {policy.message}
      </p>

      {!compact &&
        policy.conditions.length >
          0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Conditions
            </p>

            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-400">
              {policy.conditions.map(
                (
                  condition
                ) => (
                  <li
                    key={
                      condition
                    }
                    className="flex gap-2"
                  >
                    <span>
                      •
                    </span>

                    <span>
                      {
                        condition
                      }
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      {policy.disclosureRequired && (
        <div className="mt-4 rounded-lg border border-amber-300/15 bg-black/10 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-100">
            Disclosure required
          </p>

          {policy.disclosure
            ?.instructions && (
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {
                policy
                  .disclosure
                  .instructions
              }
            </p>
          )}

          {policy.disclosure
            ?.suggestedText && (
            <p className="mt-2 text-sm italic leading-6 text-slate-400">
              “
              {
                policy
                  .disclosure
                  .suggestedText
              }
              ”
            </p>
          )}
        </div>
      )}

      {!compact &&
        policy.provenance && (
          <div className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">
            Verified{" "}
            {
              policy.provenance
                .verifiedOn
            }
            {" · "}
            {
              policy.provenance
                .confidence
            }
          </div>
        )}

      {!compact &&
        policy.sources.length >
          0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {policy.sources.map(
              (
                source
              ) => (
                <a
                  key={
                    source.id
                  }
                  href={
                    source.url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-200"
                >
                  {
                    source.title
                  }
                  {" ↗"}
                </a>
              )
            )}
          </div>
        )}
    </div>
  );
}
