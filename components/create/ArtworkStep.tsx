"use client";

import {
  type ComponentProps,
} from "react";

import ArtworkStepCore from "./ArtworkStepCore";
import PublicationAiPolicyNotice from "./PublicationAiPolicyNotice";
import {
  usePublicationAiPolicy,
} from "./usePublicationAiPolicy";

type Props =
  ComponentProps<
    typeof ArtworkStepCore
  >;

export default function ArtworkStep(
  props: Props
) {
  const {
    policy,
    loading,
    error,
  } =
    usePublicationAiPolicy({
      publisher:
        props.publisher,
      journal:
        props.journal,
      artworkType:
        props.artworkType,
      aiUseType:
        "generative-creation",
    });

  const manualVerificationRequired =
    policy?.status ===
      "manual-check" &&
    !props.manualPolicyConfirmed;

  if (
    manualVerificationRequired
  ) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 8 OF 8
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Author verification required
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          This saved project was resumed without restoring a previous manual AI-policy acknowledgement. CoverLab requires a fresh author verification before another generative operation can run.
        </p>

        <div className="mt-8">
          <PublicationAiPolicyNotice
            policy={policy}
            loading={loading}
            error={error}
            operationLabel="AI artwork generation"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/[0.03] p-6">
          <p className="text-sm font-medium text-amber-100">
            Return to the publication review
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Go back through the workflow to the Journal step, review the current publication policy, and complete the Author verification checkbox again. The policy classification remains manual-check after acknowledgement.
          </p>
        </div>

        <button
          type="button"
          onClick={
            props.onBack
          }
          className="mt-7 rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back to production brief
        </button>
      </section>
    );
  }

  return (
    <ArtworkStepCore
      {...props}
    />
  );
}
