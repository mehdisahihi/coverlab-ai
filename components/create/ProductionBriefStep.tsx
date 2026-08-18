"use client";

import { useEffect, useState } from "react";
import type { Concept } from "./ConceptsStep";

export type ProductionBrief = {
  visual_objective: string;
  hero_subject: string;
  mandatory_scientific_elements: string[];
  scientific_constraints: string[];
  composition: string;
  spatial_layout: string[];
  materials_and_surfaces: string[];
  lighting_and_color: string;
  atmosphere: string;
  allowed_artistic_metaphors: string[];
  avoid: string[];
  asset_instructions: string[];
  image_generation_instruction: string;
};

type ProductionBriefStepProps = {
  title: string;
  abstract: string;

  publisher: string;
  journal: string;
  artworkType: string;

  selectedConcept: Concept;

  visualStyle: string;
  visualEmphasis: string;
  visualMood: string;
  visualNotes: string;

  assetNotes: string;
  assetNames: string[];

  realism: string;
  freedom: string;
  composition: string;
  colorDirection: string;
  preserveAssets: boolean;
  artNotes: string;

  result: ProductionBrief | null;
  setResult: (result: ProductionBrief | null) => void;

  onBack: () => void;
  onGenerateArtwork: () => void;
};

export default function ProductionBriefStep({
  title,
  abstract,

  publisher,
  journal,
  artworkType,

  selectedConcept,

  visualStyle,
  visualEmphasis,
  visualMood,
  visualNotes,

  assetNotes,
  assetNames,

  realism,
  freedom,
  composition,
  colorDirection,
  preserveAssets,
  artNotes,

  result,
  onGenerateArtwork,
  setResult,

  onBack,
}: ProductionBriefStepProps) {
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState("");

  async function buildBrief() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/production-brief", {
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

          selectedConcept,

          visualStyle,
          visualEmphasis,
          visualMood,
          visualNotes,

          assetNotes,
          assetNames,

          realism,
          freedom,
          composition,
          colorDirection,
          preserveAssets,
          artNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to build production brief."
        );
      }

      setResult(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while building the production brief."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!result) {
      buildBrief();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 7 OF 7
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Building the production brief
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          CoverLab is translating the scientific concept and your art direction
          into image-production instructions.
        </p>

        <div className="mt-12 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8">
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />

            <div>
              <p className="font-medium text-white">
                Preparing production instructions...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Scientific constraints are being preserved.
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
          STEP 7 OF 7
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          We couldn&apos;t build the production brief
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
            onClick={buildBrief}
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
        STEP 7 OF 7
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Production brief
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        This is the visual specification CoverLab will use to generate the
        artwork.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <BriefCard
          title="Visual objective"
          text={result.visual_objective}
        />

        <BriefCard
          title="Hero subject"
          text={result.hero_subject}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ListCard
          title="Mandatory scientific elements"
          items={result.mandatory_scientific_elements}
          tone="cyan"
        />

        <ListCard
          title="Scientific constraints"
          items={result.scientific_constraints}
          tone="amber"
        />
      </div>

      <div className="mt-6">
        <BriefCard
          title="Composition"
          text={result.composition}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ListCard
          title="Spatial layout"
          items={result.spatial_layout}
        />

        <ListCard
          title="Materials & surfaces"
          items={result.materials_and_surfaces}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BriefCard
          title="Lighting & color"
          text={result.lighting_and_color}
        />

        <BriefCard
          title="Atmosphere"
          text={result.atmosphere}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ListCard
          title="Allowed artistic metaphors"
          items={result.allowed_artistic_metaphors}
        />

        <ListCard
          title="Avoid"
          items={result.avoid}
          tone="red"
        />
      </div>

      <div className="mt-6">
        <ListCard
          title="Scientific asset instructions"
          items={result.asset_instructions}
        />
      </div>

      {/* Final generation instruction */}
      <div className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-400/[0.04] p-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
          Image generation instruction
        </p>

        <p className="mt-5 whitespace-pre-line leading-7 text-slate-200">
          {result.image_generation_instruction}
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back to art direction
        </button>

        <button
          onClick={() => {
            setResult(null);
            buildBrief();
          }}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
        >
          ↻ Rebuild brief
        </button>

        <button
           type="button"
           onClick={onGenerateArtwork}
           className="rounded-full bg-cyan-300 px-7 py-3.5 font-medium text-black transition hover:bg-cyan-200"
        >
         Generate artwork →
        </button>
        
        
      </div>
    </section>
  );
}

function BriefCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      <p className="mt-4 leading-7 text-slate-300">
        {text}
      </p>
    </div>
  );
}

function ListCard({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "cyan" | "amber" | "red";
}) {
  const classes = {
    default:
      "border-white/10 bg-white/[0.03]",
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.035]",
    amber:
      "border-amber-300/15 bg-amber-300/[0.035]",
    red:
      "border-red-400/15 bg-red-400/[0.035]",
  };

  return (
    <div className={`rounded-2xl border p-6 ${classes[tone]}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span className="text-cyan-300">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}