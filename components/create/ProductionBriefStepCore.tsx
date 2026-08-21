"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

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
  setResult: Dispatch<SetStateAction<ProductionBrief | null>>;

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
  setResult,

  onBack,
  onGenerateArtwork,
}: ProductionBriefStepProps) {
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [modified, setModified] = useState(false);

  const originalBrief = useRef<ProductionBrief | null>(
    result ? cloneBrief(result) : null
  );

  async function buildBrief() {
    try {
      setLoading(true);
      setError("");
      setEditing(false);
      setModified(false);

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

      originalBrief.current = cloneBrief(data);
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

  function updateTextField(
    field:
      | "visual_objective"
      | "hero_subject"
      | "composition"
      | "lighting_and_color"
      | "atmosphere"
      | "image_generation_instruction",
    value: string
  ) {
    setResult((current) => {
      if (!current) return current;

      return {
        ...current,
        [field]: value,
      };
    });

    setModified(true);
  }

  function updateArrayField(
    field:
      | "mandatory_scientific_elements"
      | "scientific_constraints"
      | "spatial_layout"
      | "materials_and_surfaces"
      | "allowed_artistic_metaphors"
      | "avoid"
      | "asset_instructions",
    value: string
  ) {
    const items = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setResult((current) => {
      if (!current) return current;

      return {
        ...current,
        [field]: items,
      };
    });

    setModified(true);
  }

  function restoreAIOriginal() {
    if (!originalBrief.current) return;

    setResult(cloneBrief(originalBrief.current));
    setModified(false);
  }

  if (loading) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 7 OF 8
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Building the production brief
        </h1>

        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          CoverLab is translating the scientific concept and your art
          direction into image-production instructions.
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
          STEP 7 OF 8
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cyan-300">
            STEP 7 OF 8
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Production brief
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            Review and edit the visual specification before CoverLab
            generates the artwork.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className={`rounded-full border px-6 py-3 text-sm font-medium transition ${
            editing
              ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
              : "border-white/10 text-white hover:border-cyan-400/40"
          }`}
        >
          {editing ? "✓ Editing enabled" : "✎ Edit production brief"}
        </button>
      </div>

      {/* Researcher edit status */}
      {modified && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-4">
          <div>
            <p className="text-sm font-medium text-violet-200">
              Researcher-edited brief
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Your changes will be used for artwork generation.
            </p>
          </div>

          <button
            type="button"
            onClick={restoreAIOriginal}
            className="rounded-full border border-white/10 px-4 py-2 text-xs transition hover:bg-white/5"
          >
            Restore AI version
          </button>
        </div>
      )}

      {/* Basic fields */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <EditableTextCard
          title="Visual objective"
          value={result.visual_objective}
          editing={editing}
          onChange={(value) =>
            updateTextField("visual_objective", value)
          }
        />

        <EditableTextCard
          title="Hero subject"
          value={result.hero_subject}
          editing={editing}
          onChange={(value) =>
            updateTextField("hero_subject", value)
          }
        />
      </div>

      {/* Sensitive scientific fields */}
      <div className="mt-6 rounded-xl border border-amber-300/15 bg-amber-300/[0.025] p-4">
        <p className="text-sm font-medium text-amber-100">
          Scientific control
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          The next two sections directly control scientific accuracy.
          You may edit them, but only remove or change constraints when
          scientifically justified by your research.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EditableListCard
          title="Mandatory scientific elements"
          items={result.mandatory_scientific_elements}
          editing={editing}
          sensitive
          onChange={(value) =>
            updateArrayField(
              "mandatory_scientific_elements",
              value
            )
          }
        />

        <EditableListCard
          title="Scientific constraints"
          items={result.scientific_constraints}
          editing={editing}
          sensitive
          onChange={(value) =>
            updateArrayField(
              "scientific_constraints",
              value
            )
          }
        />
      </div>

      <div className="mt-6">
        <EditableTextCard
          title="Composition"
          value={result.composition}
          editing={editing}
          onChange={(value) =>
            updateTextField("composition", value)
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EditableListCard
          title="Spatial layout"
          items={result.spatial_layout}
          editing={editing}
          onChange={(value) =>
            updateArrayField("spatial_layout", value)
          }
        />

        <EditableListCard
          title="Materials & surfaces"
          items={result.materials_and_surfaces}
          editing={editing}
          onChange={(value) =>
            updateArrayField("materials_and_surfaces", value)
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EditableTextCard
          title="Lighting & color"
          value={result.lighting_and_color}
          editing={editing}
          onChange={(value) =>
            updateTextField("lighting_and_color", value)
          }
        />

        <EditableTextCard
          title="Atmosphere"
          value={result.atmosphere}
          editing={editing}
          onChange={(value) =>
            updateTextField("atmosphere", value)
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EditableListCard
          title="Allowed artistic metaphors"
          items={result.allowed_artistic_metaphors}
          editing={editing}
          onChange={(value) =>
            updateArrayField(
              "allowed_artistic_metaphors",
              value
            )
          }
        />

        <EditableListCard
          title="Avoid"
          items={result.avoid}
          editing={editing}
          sensitive
          onChange={(value) =>
            updateArrayField("avoid", value)
          }
        />
      </div>

      <div className="mt-6">
        <EditableListCard
          title="Scientific asset instructions"
          items={result.asset_instructions}
          editing={editing}
          onChange={(value) =>
            updateArrayField("asset_instructions", value)
          }
        />
      </div>

      {/* Final image prompt */}
      <div className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-400/[0.04] p-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
          Image generation instruction
        </p>

        {editing ? (
          <>
            <textarea
              value={result.image_generation_instruction}
              onChange={(e) =>
                updateTextField(
                  "image_generation_instruction",
                  e.target.value
                )
              }
              rows={14}
              className="mt-5 w-full resize-y rounded-xl border border-violet-400/20 bg-black/20 px-4 py-4 leading-7 text-slate-200 outline-none focus:border-violet-400/60"
            />

            <p className="mt-3 text-xs leading-5 text-slate-500">
              This is the final instruction sent to the image-generation
              pipeline. Scientific constraints are also supplied separately.
            </p>
          </>
        ) : (
          <p className="mt-5 whitespace-pre-line leading-7 text-slate-200">
            {result.image_generation_instruction}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back to art direction
        </button>

        <button
          onClick={buildBrief}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]"
        >
          ↻ Ask AI to rebuild brief
        </button>

        <button
          type="button"
          onClick={onGenerateArtwork}
          className="rounded-full bg-cyan-300 px-7 py-3.5 font-medium text-black transition hover:bg-cyan-200"
        >
          {modified
            ? "Generate from my edited brief →"
            : "Generate artwork →"}
        </button>
      </div>
    </section>
  );
}

function EditableTextCard({
  title,
  value,
  editing,
  onChange,
}: {
  title: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 leading-7 text-slate-200 outline-none focus:border-cyan-400/50"
        />
      ) : (
        <p className="mt-4 leading-7 text-slate-300">
          {value}
        </p>
      )}
    </div>
  );
}

function EditableListCard({
  title,
  items,
  editing,
  onChange,
  sensitive = false,
}: {
  title: string;
  items: string[];
  editing: boolean;
  onChange: (value: string) => void;
  sensitive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        sensitive
          ? "border-amber-300/15 bg-amber-300/[0.025]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {title}
        </p>

        {sensitive && (
          <span className="text-xs text-amber-200/60">
            Scientific
          </span>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            value={items.join("\n")}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.max(5, items.length + 1)}
            className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 leading-7 text-slate-200 outline-none focus:border-cyan-400/50"
          />

          <p className="mt-2 text-xs text-slate-500">
            One item per line.
          </p>
        </>
      ) : (
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <span className="text-cyan-300">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function cloneBrief(
  brief: ProductionBrief
): ProductionBrief {
  return {
    ...brief,
    mandatory_scientific_elements: [
      ...brief.mandatory_scientific_elements,
    ],
    scientific_constraints: [
      ...brief.scientific_constraints,
    ],
    spatial_layout: [...brief.spatial_layout],
    materials_and_surfaces: [
      ...brief.materials_and_surfaces,
    ],
    allowed_artistic_metaphors: [
      ...brief.allowed_artistic_metaphors,
    ],
    avoid: [...brief.avoid],
    asset_instructions: [...brief.asset_instructions],
  };
}