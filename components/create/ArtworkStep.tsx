"use client";

import { useState } from "react";
import type { ProductionBrief } from "./ProductionBriefStep";

type ArtworkStepProps = {
  brief: ProductionBrief;
  initialImage: string | null;
  setInitialImage: (value: string | null) => void;
  onBack: () => void;
};

export default function ArtworkStep({
  brief,
  initialImage,
  setInitialImage,
  onBack,
}: ArtworkStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateArtwork() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/generate-artwork", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          imageGenerationInstruction:
            brief.image_generation_instruction,

          scientificConstraints:
            brief.scientific_constraints,

          avoid:
            brief.avoid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate artwork."
        );
      }

      setInitialImage(data.image);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the artwork."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-5xl">
      <p className="text-sm font-medium text-cyan-300">
        ARTWORK
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Generate your first cover draft
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        CoverLab will now translate the approved production brief into
        a visual draft. This is a starting point, not yet the final artwork.
      </p>

      {!initialImage && !loading && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-lg font-medium text-white">
            Ready for the first visual draft
          </p>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            One vertical medium-quality image will be generated from the
            production brief. We&apos;ll add refinement controls after this
            pipeline is validated.
          </p>

          <button
            onClick={generateArtwork}
            className="mt-7 rounded-full bg-cyan-300 px-7 py-3.5 font-medium text-black transition hover:bg-cyan-200"
          >
            Generate first draft →
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />

            <div>
              <p className="font-medium text-white">
                Generating artwork...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                This can take noticeably longer than text concept generation.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-6">
          <p className="text-sm text-red-200">
            {error}
          </p>
        </div>
      )}

      {initialImage && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
            <img
              src={initialImage}
              alt="Generated scientific journal cover draft"
              className="h-auto w-full object-contain"
            />
          </div>

          <div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                Draft review
              </p>

              <h2 className="mt-4 text-xl font-medium">
                How does this direction look?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                At this stage, evaluate the overall composition, scientific
                plausibility and artistic direction. We&apos;ll add targeted
                refinement next.
              </p>
            </div>

            <button
              onClick={generateArtwork}
              disabled={loading}
              className="mt-5 w-full rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
            >
              ↻ Generate another draft
            </button>
          </div>
        </div>
      )}

      <div className="mt-10">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back to production brief
        </button>
      </div>
    </section>
  );
}