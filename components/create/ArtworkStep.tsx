"use client";

import {
  type ComponentProps,
  useEffect,
  useState,
} from "react";

import ArtworkStepCore from "./ArtworkStepCore";
import PublicationAiPolicyNotice from "./PublicationAiPolicyNotice";
import {
  usePublicationAiPolicy,
} from "./usePublicationAiPolicy";
import {
  createClient,
} from "@/lib/supabase/client";
import {
  isModelReferenceAsset,
  type ProjectAsset,
} from "@/lib/storage/projectAssets";

type CoreProps =
  ComponentProps<
    typeof ArtworkStepCore
  >;

type Props =
  Omit<
    CoreProps,
    "files"
  > & {
    assets:
      ProjectAsset[];
  };

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

  const [
    referenceFiles,
    setReferenceFiles,
  ] =
    useState<File[]>([]);
  const [
    referencesLoading,
    setReferencesLoading,
  ] =
    useState(false);
  const [
    referencesError,
    setReferencesError,
  ] =
    useState<string | null>(null);

  useEffect(
    () => {
      let cancelled = false;

      if (
        manualVerificationRequired
      ) {
        setReferenceFiles([]);
        setReferencesLoading(false);
        setReferencesError(null);
        return;
      }

      const eligibleAssets =
        props.assets
          .filter(
            isModelReferenceAsset
          )
          .slice(0, 3);

      if (
        eligibleAssets.length ===
        0
      ) {
        setReferenceFiles([]);
        setReferencesLoading(false);
        setReferencesError(null);
        return;
      }

      async function loadReferences() {
        setReferencesLoading(true);
        setReferencesError(null);

        try {
          const supabase =
            createClient();
          const loadedFiles:
            File[] = [];

          for (
            const asset of
            eligibleAssets
          ) {
            const {
              data,
              error:
                downloadError,
            } =
              await supabase.storage
                .from(
                  asset.bucketId
                )
                .download(
                  asset.objectPath
                );

            if (
              downloadError ||
              !data
            ) {
              throw new Error(
                downloadError
                  ?.message ||
                  `Could not load ${asset.originalName} from private storage.`
              );
            }

            loadedFiles.push(
              new File(
                [data],
                asset.originalName,
                {
                  type:
                    asset.mimeType ||
                    data.type,
                }
              )
            );
          }

          if (!cancelled) {
            setReferenceFiles(
              loadedFiles
            );
          }
        } catch (loadError) {
          if (!cancelled) {
            setReferenceFiles([]);
            setReferencesError(
              loadError instanceof Error
                ? loadError.message
                : "Could not load private scientific reference images."
            );
          }
        } finally {
          if (!cancelled) {
            setReferencesLoading(false);
          }
        }
      }

      void loadReferences();

      return () => {
        cancelled = true;
      };
    },
    [
      props.assets,
      manualVerificationRequired,
    ]
  );

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

  if (referencesLoading) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 8 OF 8
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Loading scientific references
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          CoverLab is securely restoring eligible reference images from private project storage.
        </p>
      </section>
    );
  }

  if (referencesError) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 8 OF 8
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Scientific references unavailable
        </h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
          <p className="text-sm leading-6 text-red-200">
            {referencesError}
          </p>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
          Generation is paused rather than silently omitting researcher-supplied scientific reference material.
        </p>
        <button
          type="button"
          onClick={props.onBack}
          className="mt-7 rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back to production brief
        </button>
      </section>
    );
  }

  const {
    assets: _assets,
    ...coreProps
  } = props;

  return (
    <ArtworkStepCore
      {...coreProps}
      files={referenceFiles}
    />
  );
}
