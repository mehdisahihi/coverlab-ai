"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import ProductionBriefStepCore from "./ProductionBriefStepCore";

export type {
  ProductionBrief,
} from "./ProductionBriefStepCore";

type Props =
  ComponentProps<
    typeof ProductionBriefStepCore
  >;

export default function ProductionBriefStep(
  props: Props
) {
  const [
    initialLoading,
    setInitialLoading,
  ] = useState(
    !props.result
  );
  const [
    initialError,
    setInitialError,
  ] = useState("");
  const initialRequestStartedRef =
    useRef(false);

  async function buildInitialBrief() {
    try {
      setInitialLoading(true);
      setInitialError("");

      const response =
        await fetch(
          "/api/production-brief",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                title:
                  props.title,
                abstract:
                  props.abstract,
                journal:
                  props.journal,
                publisher:
                  props.publisher,
                artworkType:
                  props.artworkType,
                selectedConcept:
                  props.selectedConcept,
                visualStyle:
                  props.visualStyle,
                visualEmphasis:
                  props.visualEmphasis,
                visualMood:
                  props.visualMood,
                visualNotes:
                  props.visualNotes,
                assetNotes:
                  props.assetNotes,
                assetNames:
                  props.assetNames,
                realism:
                  props.realism,
                freedom:
                  props.freedom,
                composition:
                  props.composition,
                colorDirection:
                  props.colorDirection,
                preserveAssets:
                  props.preserveAssets,
                artNotes:
                  props.artNotes,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setInitialError(
          data?.error ||
            "Failed to build production brief."
        );
        return;
      }

      props.setResult(
        data
      );
    } catch (error) {
      setInitialError(
        error instanceof Error
          ? error.message
          : "Something went wrong while building the production brief."
      );
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    if (
      !props.result &&
      !initialRequestStartedRef.current
    ) {
      initialRequestStartedRef.current = true;
      void buildInitialBrief();
    }

    // The initial request is intentionally one-shot for the mounted step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!props.result) {
    if (
      initialLoading &&
      !initialError
    ) {
      return (
        <section className="max-w-4xl">
          <p className="text-sm font-medium text-cyan-300">
            STEP 7 OF 8
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Building the production brief
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            CoverLab is translating the scientific concept and your art direction into image-production instructions.
          </p>
          <div className="mt-12 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
              <p className="text-sm text-slate-300">
                Preparing production instructions...
              </p>
            </div>
          </div>
        </section>
      );
    }

    if (initialError) {
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
              {initialError}
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={
                props.onBack
              }
              className="rounded-full border border-white/10 px-6 py-3 transition hover:bg-white/5"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                initialRequestStartedRef.current = true;
                void buildInitialBrief();
              }}
              className="rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-slate-200"
            >
              Try again
            </button>
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <ProductionBriefStepCore
      {...props}
    />
  );
}
