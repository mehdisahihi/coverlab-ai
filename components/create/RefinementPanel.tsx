"use client";

import { useState } from "react";

import PublicationAiPolicyNotice from "./PublicationAiPolicyNotice";
import {
  useArtworkPersistence,
} from "./ArtworkPersistenceContext";

import {
  usePublicationAiPolicy,
} from "./usePublicationAiPolicy";

type Direction =
  | "balanced"
  | "more-scientific"
  | "more-artistic";

type RefinementPanelProps = {
  currentImage: string;

  publisher: string;
  journal: string;
  artworkType: string;
  manualPolicyConfirmed: boolean;

  scientificConstraints: string[];
  avoid: string[];

  referenceImages: {
    name: string;
    dataUrl: string;
  }[];

  onRefined:
    (
      image: string
    ) => void | Promise<void>;
};

export default function RefinementPanel({
  currentImage,

  publisher,
  journal,
  artworkType,
  manualPolicyConfirmed,


  scientificConstraints,
  avoid,

  referenceImages,

  onRefined,
}: RefinementPanelProps) {
  const artworkPersistence =
    useArtworkPersistence();

  const [preserveScientificContent, setPreserveScientificContent] =
    useState(true);

  const [removeUnverifiedElements, setRemoveUnverifiedElements] =
    useState(true);

  const [direction, setDirection] =
    useState<Direction>("balanced");

  const [changeComposition, setChangeComposition] =
    useState(false);

  const [changeLighting, setChangeLighting] =
    useState(false);

  const [customInstruction, setCustomInstruction] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const {
    policy:
      refinementPolicy,

    loading:
      refinementPolicyLoading,

    error:
      refinementPolicyError,

    blocked:
      refinementPolicyBlocked,
  } =
    usePublicationAiPolicy({
      publisher,
      journal,
      artworkType,

      aiUseType:
        "generative-refinement",
    });

  async function refineArtwork() {
    if (
      refinementPolicyLoading
    ) {
      setError(
        "Please wait while CoverLab verifies the publication AI policy."
      );

      return;
    }

    if (
      !refinementPolicy ||
      refinementPolicyBlocked
    ) {
      setError(
        refinementPolicy
          ?.message ||
          "AI refinement cannot proceed until the publication AI policy has been verified."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/refine-artwork",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            currentImage,

            publisher,
            journal,
            artworkType,
            manualPolicyConfirmed,

            referenceImages,

            scientificConstraints,
            avoid,

            preserveScientificContent,
            removeUnverifiedElements,

            direction,

            changeComposition,
            changeLighting,

            customInstruction,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to refine artwork."
        );
        return;
      }

      if (
        !data?.image ||
        typeof data.image !==
          "string"
      ) {
        setError(
          "The refinement endpoint returned no artwork image."
        );
        return;
      }

      if (artworkPersistence) {
        await artworkPersistence.persistVersion({
          image:
            data.image,
          operation:
            "refinement",
          sourceVersionId:
            artworkPersistence.selectedVersionId,
          selectAfterSave:
            false,
          metadata: {
            label:
              "Scientific refinement",
            direction,
            preserveScientificContent,
            removeUnverifiedElements,
            changeComposition,
            changeLighting,
          },
        });
      }

      await onRefined(
        data.image
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during refinement."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
        Scientific refinement
      </p>

      <h2 className="mt-4 text-xl font-medium text-white">
        Refine this draft
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        Preserve what works and tell CoverLab exactly what should change.
      </p>

      {/* Scientific controls */}
      <div className="mt-7 space-y-3">
        <ToggleCard
          checked={preserveScientificContent}
          onChange={setPreserveScientificContent}
          title="Preserve scientific content"
          description="Keep recognizable scientific subjects, geometry and relationships."
        />

        <ToggleCard
          checked={removeUnverifiedElements}
          onChange={setRemoveUnverifiedElements}
          title="Remove unverified scientific elements"
          description="Remove invented formulas, symbols, structures and unsupported scientific-looking decoration."
          highlighted
        />
      </div>

      {/* Direction */}
      <div className="mt-7">
        <p className="text-sm font-medium text-white">
          Scientific ↔ artistic direction
        </p>

        <div className="mt-3 grid gap-2">
          <DirectionButton
            active={direction === "more-scientific"}
            onClick={() =>
              setDirection("more-scientific")
            }
            title="More scientifically literal"
            description="Reduce metaphor and decorative interpretation."
          />

          <DirectionButton
            active={direction === "balanced"}
            onClick={() =>
              setDirection("balanced")
            }
            title="Keep current balance"
            description="Preserve the current science/art relationship."
          />

          <DirectionButton
            active={direction === "more-artistic"}
            onClick={() =>
              setDirection("more-artistic")
            }
            title="More artistic"
            description="Increase visual drama without changing scientific meaning."
          />
        </div>
      </div>

      {/* Visual changes */}
      <div className="mt-7">
        <p className="text-sm font-medium text-white">
          What else may change?
        </p>

        <div className="mt-3 space-y-3">
          <ToggleCard
            checked={changeComposition}
            onChange={setChangeComposition}
            title="Allow composition changes"
            description="Let AI reposition elements and improve visual hierarchy."
          />

          <ToggleCard
            checked={changeLighting}
            onChange={setChangeLighting}
            title="Allow lighting & color changes"
            description="Permit improvements to atmosphere, contrast and color harmony."
          />
        </div>
      </div>

      {/* Custom */}
      <div className="mt-7">
        <label className="text-sm font-medium text-white">
          Custom refinement
        </label>

        <textarea
          value={customInstruction}
          onChange={(e) =>
            setCustomInstruction(e.target.value)
          }
          rows={5}
          placeholder="Example: Remove the chemical formulas from the polymer surface. Keep the protein positions and camera angle. Make the interfacial water more visible."
          className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
        />
      </div>

      <div className="mt-6">
        <PublicationAiPolicyNotice
          policy={
            refinementPolicy
          }
          loading={
            refinementPolicyLoading
          }
          error={
            refinementPolicyError
          }
          operationLabel="AI refinement"
          compact
        />
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
          <p className="text-sm text-red-200">
            {error}
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={
          loading ||
          refinementPolicyLoading ||
          !refinementPolicy ||
          refinementPolicyBlocked
        }
        onClick={refineArtwork}
        className="mt-7 w-full rounded-full bg-cyan-300 px-6 py-3.5 font-medium text-black transition enabled:hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading
          ? "Refining artwork..."
          : "Apply refinement →"}
      </button>

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />

          Editing the current image...
        </div>
      )}
    </div>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description,
  highlighted = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
  highlighted?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        checked
          ? highlighted
            ? "border-amber-300/30 bg-amber-300/[0.05]"
            : "border-cyan-400/25 bg-cyan-400/[0.04]"
          : "border-white/10 bg-black/10"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="mt-1"
      />

      <div>
        <p className="text-sm font-medium text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </label>
  );
}

function DirectionButton({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-violet-400/40 bg-violet-400/[0.07]"
          : "border-white/10 bg-black/10 hover:border-white/20"
      }`}
    >
      <p className="text-sm font-medium text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </button>
  );
}
