"use client";

import {
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ArtworkStepCore from "./ArtworkStepCore";
import PublicationAiPolicyNotice from "./PublicationAiPolicyNotice";
import StoredArtworkHistory from "./StoredArtworkHistory";
import {
  ArtworkPersistenceProvider,
  type PersistArtworkVersionInput,
} from "./ArtworkPersistenceContext";
import {
  useArtworkVersions,
} from "./useArtworkVersions";
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
import type {
  StoredArtworkVersion,
} from "@/lib/storage/artworkVersions";

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
    projectId,
    setProjectId,
  ] =
    useState<string | null>(null);
  const [
    projectIdResolved,
    setProjectIdResolved,
  ] =
    useState(false);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    setProjectId(
      params.get("project")
    );
    setProjectIdResolved(true);
  }, []);

  const ensureArtworkProject =
    useCallback(
      async () =>
        projectId,
      [projectId]
    );

  const {
    versions:
      storedVersions,
    loading:
      versionsLoading,
    error:
      versionsError,
    saveVersion,
  } =
    useArtworkVersions({
      projectId,
      ensureProject:
        ensureArtworkProject,
    });

  const [
    selectedVersionId,
    setSelectedVersionId,
  ] =
    useState<string | null>(null);
  const [
    storageError,
    setStorageError,
  ] =
    useState<string | null>(null);
  const [
    storageSaving,
    setStorageSaving,
  ] =
    useState(false);

  const persistedImageIdsRef =
    useRef(
      new Map<string, string>()
    );

  useEffect(
    () => {
      const nextMap =
        new Map<string, string>();

      for (
        const version of
        storedVersions
      ) {
        nextMap.set(
          version.image,
          version.id
        );
      }

      persistedImageIdsRef.current =
        nextMap;

      if (
        storedVersions.length ===
        0
      ) {
        if (selectedVersionId) {
          setSelectedVersionId(
            null
          );
        }

        return;
      }

      if (
        selectedVersionId &&
        storedVersions.some(
          (version) =>
            version.id ===
            selectedVersionId
        )
      ) {
        return;
      }

      const latest =
        storedVersions[
          storedVersions.length - 1
        ];

      setSelectedVersionId(
        latest.id
      );

      if (
        props.initialImage !==
        latest.image
      ) {
        props.setInitialImage(
          latest.image
        );
      }
    },
    [
      storedVersions,
      selectedVersionId,
      props.initialImage,
      props.setInitialImage,
    ]
  );

  const persistVersion =
    useCallback(
      async (
        input:
          PersistArtworkVersionInput
      ) => {
        setStorageSaving(true);
        setStorageError(null);

        try {
          const sourceVersionId =
            input.operation ===
            "generation"
              ? null
              : input.sourceVersionId !==
                  undefined
                ? input.sourceVersionId
                : selectedVersionId;

          const stored =
            await saveVersion({
              image:
                input.image,
              operation:
                input.operation,
              sourceVersionId,
              metadata:
                input.metadata,
            });

          persistedImageIdsRef.current.set(
            stored.image,
            stored.id
          );

          if (
            input.selectAfterSave
          ) {
            setSelectedVersionId(
              stored.id
            );
          }

          return stored;
        } catch (
          persistError
        ) {
          const message =
            persistError instanceof Error
              ? persistError.message
              : "Could not save the artwork version to private storage.";

          setStorageError(
            message
          );

          throw persistError;
        } finally {
          setStorageSaving(false);
        }
      },
      [
        saveVersion,
        selectedVersionId,
      ]
    );

  const persistenceContextValue =
    useMemo(
      () => ({
        selectedVersionId,
        persistVersion,
      }),
      [
        selectedVersionId,
        persistVersion,
      ]
    );

  const handleCoreInitialImage =
    useCallback(
      (
        value:
          string | null
      ) => {
        if (!value) {
          props.setInitialImage(
            null
          );
          setSelectedVersionId(
            null
          );
          return;
        }

        const knownVersionId =
          persistedImageIdsRef.current.get(
            value
          );

        if (knownVersionId) {
          setSelectedVersionId(
            knownVersionId
          );
          props.setInitialImage(
            value
          );
          setStorageError(null);
          return;
        }

        const generationNumber =
          storedVersions.filter(
            (version) =>
              version.operation ===
              "generation"
          ).length + 1;

        void persistVersion({
          image:
            value,
          operation:
            "generation",
          sourceVersionId:
            null,
          selectAfterSave:
            false,
          metadata: {
            label:
              generationNumber === 1
                ? "Initial draft"
                : `Generated draft ${generationNumber}`,
          },
        })
          .then(
            (stored) => {
              props.setInitialImage(
                value
              );
              setSelectedVersionId(
                stored.id
              );
            }
          )
          .catch(() => {
            /*
             * persistVersion already stores a
             * user-facing error. Keep the
             * previously durable image selected.
             */
          });
      },
      [
        persistVersion,
        props.setInitialImage,
        storedVersions,
      ]
    );

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

  if (
    !projectIdResolved ||
    referencesLoading ||
    versionsLoading
  ) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 8 OF 8
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Restoring private project data
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-400">
          CoverLab is securely restoring scientific references and saved artwork versions from private project storage.
        </p>
      </section>
    );
  }

  if (!projectId) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 8 OF 8
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Project storage unavailable
        </h1>
        <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
          <p className="text-sm leading-6 text-amber-100">
            This workflow does not yet have a saved project identifier. Return to the production brief and wait for the project status to show Saved before creating artwork.
          </p>
        </div>
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

  const restoreError =
    referencesError ??
    versionsError;

  if (restoreError) {
    return (
      <section className="max-w-4xl">
        <p className="text-sm font-medium text-cyan-300">
          STEP 8 OF 8
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Private project data unavailable
        </h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
          <p className="text-sm leading-6 text-red-200">
            {restoreError}
          </p>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
          AI artwork operations are paused rather than creating an untracked result or silently omitting researcher-supplied scientific material.
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

  function selectStoredVersion(
    version:
      StoredArtworkVersion
  ) {
    setSelectedVersionId(
      version.id
    );
    props.setInitialImage(
      version.image
    );
    setStorageError(null);
  }

  return (
    <ArtworkPersistenceProvider
      value={
        persistenceContextValue
      }
    >
      {storageError && (
        <div className="mb-6 max-w-6xl rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
          <p className="text-sm font-medium text-red-100">
            Artwork storage needs attention
          </p>
          <p className="mt-2 text-sm leading-6 text-red-200/80">
            {storageError}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            CoverLab keeps the previously durable artwork selected rather than treating an unsaved image as part of the project history.
          </p>
        </div>
      )}

      {storageSaving && (
        <div className="mb-6 max-w-6xl rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4 text-sm text-cyan-100">
          Saving artwork version to private project storage…
        </div>
      )}

      <div
        className={
          storageSaving
            ? "pointer-events-none opacity-80 [&>section>div.mt-12]:hidden [&>section>div.mt-10:last-child]:hidden"
            : "[&>section>div.mt-12]:hidden [&>section>div.mt-10:last-child]:hidden"
        }
      >
        <ArtworkStepCore
          key={
            selectedVersionId ??
            "new-artwork"
          }
          {...coreProps}
          files={referenceFiles}
          setInitialImage={
            handleCoreInitialImage
          }
        />
      </div>

      <StoredArtworkHistory
        versions={storedVersions}
        selectedVersionId={
          selectedVersionId
        }
        onSelect={
          selectStoredVersion
        }
      />

      <div className="mt-10">
        <button
          type="button"
          onClick={props.onBack}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back to production brief
        </button>
      </div>
    </ArtworkPersistenceProvider>
  );
}
