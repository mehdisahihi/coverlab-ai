"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type Concept = {
  title: string;
  idea: string;
  scientific_elements: string[];
  artistic_elements: string[];
  composition: string;
  caution: string;
};

export type AIResult = {
  scientific_summary: string;
  concepts: Concept[];
};

type ConceptsStepProps = {
  title: string;
  abstract: string;
  publisher: string;
  journal: string;
  artworkType: string;
  style: string;
  emphasis: string;
  mood: string;
  visualNotes: string;

  result: AIResult | null;
  setResult: Dispatch<SetStateAction<AIResult | null>>;

  onBack: () => void;
  onDevelop: (concept: Concept) => void;
};

type InterestStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";

function currentProjectId() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return new URLSearchParams(
    window.location.search
  ).get("project");
}

export default function ConceptsStep({
  title,
  abstract,
  publisher,
  journal,
  artworkType,
  style,
  emphasis,
  mood,
  visualNotes,
  result,
  setResult,
  onBack,
  onDevelop,
}: ConceptsStepProps) {
  const [loading, setLoading] =
    useState(!result);
  const [error, setError] =
    useState("");
  const [
    showPreRevenueGate,
    setShowPreRevenueGate,
  ] =
    useState(false);
  const [
    interestStatus,
    setInterestStatus,
  ] =
    useState<InterestStatus>(
      "idle"
    );
  const [
    interestError,
    setInterestError,
  ] =
    useState("");
  const initialRequestStartedRef =
    useRef(false);
  const paywallViewRecordedRef =
    useRef(false);

  const price =
    artworkType ===
    "Journal Cover"
      ? 149
      : 99;
  const serviceName =
    artworkType ===
    "Journal Cover"
      ? "Journal Cover"
      : "Graphical Abstract";
  const assistedService =
    artworkType ===
    "Journal Cover"
      ? "journal_cover"
      : "graphical_abstract";

  async function recordValidationEvent(
    eventType:
      | "paywall_viewed"
      | "ready_to_pay",
    {
      silent = false,
    }: {
      silent?: boolean;
    } = {}
  ) {
    const projectId =
      currentProjectId();

    if (!projectId) {
      if (!silent) {
        setInterestStatus(
          "error"
        );
        setInterestError(
          "Your project is still being saved. Wait a moment and try again."
        );
      }

      return false;
    }

    try {
      const response =
        await fetch(
          "/api/pre-revenue/validation",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                projectId,
                eventType,
              }),
          }
        );

      const data:
        any =
        await response.json();

      if (!response.ok) {
        if (!silent) {
          setInterestStatus(
            "error"
          );
          setInterestError(
            data?.error ||
              "Your early-access interest could not be saved."
          );
        }

        return false;
      }

      return true;
    } catch (requestError) {
      if (!silent) {
        setInterestStatus(
          "error"
        );
        setInterestError(
          requestError instanceof
            Error
            ? requestError.message
            : "Your early-access interest could not be saved."
        );
      }

      return false;
    }
  }

  async function recordPaywallView() {
    if (
      paywallViewRecordedRef.current
    ) {
      return;
    }

    const recorded =
      await recordValidationEvent(
        "paywall_viewed",
        {
          silent: true,
        }
      );

    if (recorded) {
      paywallViewRecordedRef.current =
        true;
    }
  }

  async function generateConcepts() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/concepts",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title,
                abstract,
                publisher,
                journal,
                artworkType,
                style,
                emphasis,
                mood,
                visualNotes,
              }),
          }
        );

      const data:
        any =
        await response.json();

      if (!response.ok) {
        if (
          data?.code ===
          "SELF_SERVICE_PAYMENTS_NOT_OPEN"
        ) {
          setShowPreRevenueGate(
            true
          );
          void recordPaywallView();
          return;
        }

        setError(
          data?.error ||
            "Failed to generate concepts."
        );
        return;
      }

      setShowPreRevenueGate(
        false
      );
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating concepts."
      );
    } finally {
      setLoading(false);
    }
  }

  async function markReadyToPay() {
    setInterestStatus(
      "saving"
    );
    setInterestError(
      ""
    );

    const recorded =
      await recordValidationEvent(
        "ready_to_pay"
      );

    if (recorded) {
      paywallViewRecordedRef.current =
        true;
      setInterestStatus(
        "saved"
      );
    }
  }

  useEffect(() => {
    // React Strict Mode intentionally runs an extra effect cycle in
    // development. Keep the initial request idempotent so one visit
    // to this step cannot accidentally start two provider calls.
    //
    // During pre-revenue mode, ordinary users receive a server-side
    // 402 before any OpenAI request is started; the internal admin
    // account continues through the existing metered AI workflow.
    if (
      !result &&
      !initialRequestStartedRef.current
    ) {
      initialRequestStartedRef.current =
        true;
      void generateConcepts();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (
    showPreRevenueGate
  ) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 5 OF 8
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Ready for AI concepts?
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          Your project setup is free and has reached the first AI-generation
          step. Self-service payments are not open yet, so CoverLab has not
          started a billable AI request for your project.
        </p>

        <div className="mt-9 overflow-hidden rounded-3xl border border-cyan-400/25 bg-cyan-400/[0.05]">
          <div className="grid gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-start sm:p-8">
            <div>
              <p className="text-sm font-medium text-cyan-200">
                {serviceName}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Early-access launch price
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                Tell us if you would be ready to unlock AI generation at this
                price. This records demand only; it is not an order and does
                not create a payment obligation.
              </p>
            </div>

            <div className="sm:text-right">
              <div className="text-4xl font-semibold text-white">
                €{price}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                per project
              </div>
            </div>
          </div>

          <div className="border-t border-cyan-400/15 bg-black/10 px-7 py-6 sm:px-8">
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              <li>
                ✓ No card details are requested.
              </li>
              <li>
                ✓ No payment is collected today.
              </li>
              <li>
                ✓ No self-service AI provider call is started before access is opened.
              </li>
              <li>
                ✓ Your saved CoverLab project remains available in your account.
              </li>
            </ul>

            {interestStatus ===
            "saved" ? (
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-5">
                <p className="font-medium text-emerald-200">
                  You&apos;re on the early-access list.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  No payment has been taken. We can contact you at your
                  CoverLab account email when self-service payments open.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={
                  markReadyToPay
                }
                disabled={
                  interestStatus ===
                  "saving"
                }
                className="mt-6 rounded-full bg-white px-6 py-3.5 font-medium text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {interestStatus ===
                "saving"
                  ? "Saving your interest…"
                  : `I'm ready to pay €${price} — notify me`}
              </button>
            )}

            {interestStatus ===
              "error" &&
            interestError ? (
              <p className="mt-3 text-sm leading-6 text-rose-200">
                {interestError}
              </p>
            ) : null}

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Clicking the early-access button only records your interest at
              the displayed price. It does not authorize a charge.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/10 px-6 py-3 text-sm transition hover:bg-white/5"
          >
            ← Back
          </button>

          <a
            href={`/assisted?service=${assistedService}`}
            className="rounded-full border border-violet-400/20 bg-violet-400/[0.06] px-6 py-3 text-sm font-medium text-violet-200 transition hover:bg-violet-400/[0.1] hover:text-white"
          >
            Need help now? Request an assisted quote →
          </a>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 5 OF 8
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Checking AI access
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          CoverLab is checking whether this account can start the
          concept-generation workflow.
        </p>

        <div className="mt-12 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8">
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />

            <div>
              <p className="font-medium text-white">
                Preparing the next step...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No duplicate provider request can be started from this screen.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-3xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 5 OF 8
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          We couldn&apos;t generate the concepts
        </h1>

        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-6">
          <p className="text-sm text-red-200">
            {error}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="rounded-full border border-white/10 px-6 py-3 transition hover:bg-white/5"
          >
            ← Back
          </button>

          <button
            onClick={
              generateConcepts
            }
            className="rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-slate-200"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <section className="max-w-5xl">
      <p className="text-sm font-medium text-cyan-300">
        STEP 5 OF 8
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Your AI-generated concepts
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Three visual directions have been developed from your research and
        artistic preferences.
      </p>

      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
          Scientific story
        </p>

        <p className="mt-4 leading-7 text-slate-300">
          {result.scientific_summary}
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {result.concepts.map(
          (
            concept,
            index
          ) => (
            <article
              key={`${concept.title}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-400/30"
            >
              <div className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-sm text-cyan-300">
                  {String.fromCharCode(
                    65 +
                      index
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-medium text-white">
                    {concept.title}
                  </h2>

                  <p className="mt-3 leading-7 text-slate-300">
                    {concept.idea}
                  </p>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Scientific elements
                      </p>

                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                        {concept.scientific_elements.map(
                          (
                            item,
                            i
                          ) => (
                            <li
                              key={
                                i
                              }
                            >
                              •{" "}
                              {
                                item
                              }
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Artistic elements
                      </p>

                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                        {concept.artistic_elements.map(
                          (
                            item,
                            i
                          ) => (
                            <li
                              key={
                                i
                              }
                            >
                              •{" "}
                              {
                                item
                              }
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Composition
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {concept.composition}
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[0.03] p-4">
                    <p className="text-xs uppercase tracking-widest text-amber-200/70">
                      Scientific caution
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {concept.caution}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onDevelop(
                        concept
                      )
                    }
                    className="mt-6 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
                  >
                    Develop this concept →
                  </button>
                </div>
              </div>
            </article>
          )
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back
        </button>

        <button
          onClick={
            generateConcepts
          }
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
        >
          ↻ Generate new directions
        </button>
      </div>
    </section>
  );
}
