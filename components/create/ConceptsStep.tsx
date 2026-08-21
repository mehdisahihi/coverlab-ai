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
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState("");
  const initialRequestStartedRef = useRef(false);

  async function generateConcepts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/concepts", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
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
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Failed to generate concepts."
        );
        return;
      }

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

  useEffect(() => {
    // React Strict Mode intentionally runs an extra effect cycle in
    // development. Keep the initial AI request idempotent so one visit
    // to this step cannot accidentally spend two provider calls.
    if (
      !result &&
      !initialRequestStartedRef.current
    ) {
      initialRequestStartedRef.current = true;
      void generateConcepts();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 5 OF 7
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Developing your concepts
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          CoverLab is reading your scientific brief and developing three
          distinct visual directions.
        </p>

        <div className="mt-12 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8">
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />

            <div>
              <p className="font-medium text-white">
                Generating scientific concepts...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Scientific accuracy is being prioritized over visual drama.
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
          STEP 5 OF 7
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
            onClick={generateConcepts}
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
        STEP 5 OF 7
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Your AI-generated concepts
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Three visual directions have been developed from your research and
        artistic preferences.
      </p>

      {/* Scientific story */}
      <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
          Scientific story
        </p>

        <p className="mt-4 leading-7 text-slate-300">
          {result.scientific_summary}
        </p>
      </div>

      {/* Concepts */}
      <div className="mt-8 space-y-5">
        {result.concepts.map((concept, index) => (
          <article
            key={`${concept.title}-${index}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-400/30"
          >
            <div className="flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-sm text-cyan-300">
                {String.fromCharCode(65 + index)}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-medium text-white">
                  {concept.title}
                </h2>

                <p className="mt-3 leading-7 text-slate-300">
                  {concept.idea}
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {/* Scientific */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Scientific elements
                    </p>

                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {concept.scientific_elements.map((item, i) => (
                        <li key={i}>
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Artistic */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Artistic elements
                    </p>

                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {concept.artistic_elements.map((item, i) => (
                        <li key={i}>
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Composition */}
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Composition
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {concept.composition}
                  </p>
                </div>

                {/* Scientific caution */}
                <div className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[0.03] p-4">
                  <p className="text-xs uppercase tracking-widest text-amber-200/70">
                    Scientific caution
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {concept.caution}
                  </p>
                </div>

                {/* Develop */}
                <button
                  type="button"
                  onClick={() => onDevelop(concept)}
                  className="mt-6 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
                >
                  Develop this concept →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back
        </button>

        <button
          onClick={generateConcepts}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
        >
          ↻ Generate new directions
        </button>
      </div>
    </section>
  );
}