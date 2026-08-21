"use client";

import {
  useMemo,
  useState,
} from "react";

import PublicationAiPolicyNotice from "./PublicationAiPolicyNotice";

import {
  usePublicationAiPolicy,
} from "./usePublicationAiPolicy";

import type {
  ProductionBrief,
} from "./ProductionBriefStep";

import RefinementPanel from "./RefinementPanel";

import JournalValidationPanel from "./JournalValidationPanel";

import PublicationCropPreview, {
  type PublicationCropSelection,
} from "./PublicationCropPreview";

import PublicationQualityPanel from "./PublicationQualityPanel";

import PublicationExportPanel from "./PublicationExportPanel";

type ArtworkStepProps = {
  brief:
    ProductionBrief;

  publisher:
    string;

  journal:
    string;

  artworkType:
    string;
  manualPolicyConfirmed: boolean;

  files:
    File[];

  assetNotes:
    string;

  preserveAssets:
    boolean;

  initialImage:
    string | null;

  setInitialImage:
    (
      value:
        string | null
    ) => void;

  onBack:
    () => void;
};

type EncodedImage = {
  name:
    string;

  dataUrl:
    string;
};

type ArtworkVersion = {
  id:
    number;

  image:
    string;

  type:
    | "generated"
    | "refined";

  label:
    string;
};

export default function ArtworkStep({
  brief,

  publisher,
  journal,
  artworkType,
  manualPolicyConfirmed,
  files,
  assetNotes,
  preserveAssets,

  initialImage,
  setInitialImage,

  onBack,
}: ArtworkStepProps) {
  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    encodedReferences,
    setEncodedReferences,
  ] =
    useState<
      EncodedImage[]
    >([]);

  const [
    publicationCrop,
    setPublicationCrop,
  ] =
    useState<PublicationCropSelection | null>(
      null
    );

  const [
    enhancedImage,
    setEnhancedImage,
  ] =
    useState<string | null>(
      null
    );

  const [
    enhancedApproved,
    setEnhancedApproved,
  ] =
    useState(false);

  const [
    versions,
    setVersions,
  ] =
    useState<ArtworkVersion[]>(
      () =>
        initialImage
          ? [
              {
                id:
                  1,

                image:
                  initialImage,

                type:
                  "generated",

                label:
                  "Initial draft",
              },
            ]
          : []
    );

  const [
    selectedVersionId,
    setSelectedVersionId,
  ] =
    useState<number | null>(
      initialImage
        ? 1
        : null
    );

  const {
    policy:
      generationPolicy,

    loading:
      generationPolicyLoading,

    error:
      generationPolicyError,

    blocked:
      generationPolicyBlocked,
  } =
    usePublicationAiPolicy({
      publisher,
      journal,
      artworkType,

      aiUseType:
        "generative-creation",
    });

  const supportedImages =
    useMemo(
      () =>
        files.filter(
          (
            file
          ) =>
            [
              "image/png",
              "image/jpeg",
              "image/webp",
            ].includes(
              file.type
            )
        ),

      [
        files,
      ]
    );

  const ignoredFiles =
    files.filter(
      (
        file
      ) =>
        !supportedImages.includes(
          file
        )
    );

  const cropApproved =
    publicationCrop
      ?.approved ===
    true;

  /*
    If the approved native crop already
    contains at least the target number
    of pixels, enhancement is unnecessary.
  */

  const nativeCropSufficient =
    publicationCrop
      ? publicationCrop
          .cropWidth >=
          publicationCrop
            .targetWidth &&
        publicationCrop
          .cropHeight >=
          publicationCrop
            .targetHeight
      : false;

  const qualityApproved =
    cropApproved &&
    (
      nativeCropSufficient ||
      (
        Boolean(
          enhancedImage
        ) &&
        enhancedApproved
      )
    );

  async function prepareReferences() {
    const referenceImages: EncodedImage[] =
      [];

    for (
      const file of
      supportedImages.slice(
        0,
        3
      )
    ) {
      if (
        file.size >
        8 *
          1024 *
          1024
      ) {
        throw new Error(
          `${file.name} is larger than 8 MB. Please use a smaller reference image for this MVP.`
        );
      }

      const dataUrl =
        await fileToDataUrl(
          file
        );

      referenceImages.push(
        {
          name:
            file.name,

          dataUrl,
        }
      );
    }

    setEncodedReferences(
      referenceImages
    );

    return referenceImages;
  }

  function resetPublicationReview() {
    setPublicationCrop(
      null
    );

    setEnhancedImage(
      null
    );

    setEnhancedApproved(
      false
    );
  }

  function addVersion(
    image:
      string,

    type:
      | "generated"
      | "refined"
  ) {
    const newId =
      versions.length >
      0
        ? Math.max(
            ...versions.map(
              (
                version
              ) =>
                version.id
            )
          ) +
          1
        : 1;

    const newVersion: ArtworkVersion =
      {
        id:
          newId,

        image,

        type,

        label:
          type ===
          "generated"
            ? `Draft ${newId}`
            : `Refinement ${newId}`,
      };

    setVersions(
      (
        current
      ) => [
        ...current,
        newVersion,
      ]
    );

    setSelectedVersionId(
      newId
    );

    setInitialImage(
      image
    );

    resetPublicationReview();
  }

  async function generateArtwork() {
    if (
      generationPolicyLoading
    ) {
      setError(
        "Please wait while CoverLab verifies the publication AI policy."
      );

      return;
    }

    if (
      !generationPolicy ||
      generationPolicyBlocked
    ) {
      setError(
        generationPolicy
          ?.message ||
          "AI generation cannot proceed until the publication AI policy has been verified."
      );

      return;
    }

    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const referenceImages =
        await prepareReferences();

      const response =
        await fetch(
          "/api/generate-artwork",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  imageGenerationInstruction:
                    brief.image_generation_instruction,

                  scientificConstraints:
                    brief.scientific_constraints,

                  avoid:
                    brief.avoid,

                  referenceImages,

                  preserveAssets,

                  assetNotes,

                  publisher,

                  journal,

                  artworkType,

                  manualPolicyConfirmed,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Failed to generate artwork."
        );
      }

      addVersion(
        data.image,
        "generated"
      );
    } catch (err) {
      console.error(
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the artwork."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function handleRefined(
    image:
      string
  ) {
    addVersion(
      image,
      "refined"
    );
  }

  function selectVersion(
    version:
      ArtworkVersion
  ) {
    setSelectedVersionId(
      version.id
    );

    setInitialImage(
      version.image
    );

    resetPublicationReview();
  }

  /*
    Crop changes invalidate any
    previous enhanced candidate.
  */

  function handleCropChange(
    crop:
      PublicationCropSelection | null
  ) {
    setPublicationCrop(
      crop
    );

    setEnhancedImage(
      null
    );

    setEnhancedApproved(
      false
    );
  }

  function downloadOriginalArtwork() {
    if (
      !initialImage
    ) {
      return;
    }

    downloadSource(
      initialImage,

      `coverlab-original-v${selectedVersionId ?? 1}.png`
    );
  }

  return (
    <section className="max-w-6xl">
      {/* Heading */}

      <p className="text-sm font-medium text-cyan-300">
        STEP 8 OF 8
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Scientific artwork
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Generate, refine, compare,
        validate and prepare your
        scientific artwork for the
        target publication.
      </p>

      {/* Publication context */}

      <div className="mt-6 flex flex-wrap gap-2">
        {publisher && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300">
            {
              publisher
            }
          </span>
        )}

        {journal && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300">
            {
              journal
            }
          </span>
        )}

        {artworkType && (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.04] px-4 py-2 text-xs text-cyan-200">
            {
              artworkType
            }
          </span>
        )}
      </div>

      {/* References */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Scientific reference assets
        </p>

        {supportedImages.length >
        0 ? (
          <>
            <p className="mt-3 text-sm text-slate-300">
              {Math.min(
                supportedImages.length,
                3
              )}{" "}
              image reference
              {Math.min(
                supportedImages.length,
                3
              ) ===
              1
                ? ""
                : "s"}{" "}
              available.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {supportedImages
                .slice(
                  0,
                  3
                )
                .map(
                  (
                    file
                  ) => (
                    <span
                      key={
                        file.name
                      }
                      className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-slate-300"
                    >
                      {
                        file.name
                      }
                    </span>
                  )
                )}
            </div>

            {preserveAssets && (
              <p className="mt-4 text-xs leading-5 text-cyan-200">
                Scientific preservation
                enabled.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No supported reference image
            was uploaded.
          </p>
        )}

        {ignoredFiles.length >
          0 && (
          <p className="mt-3 text-xs text-slate-500">
            {
              ignoredFiles.length
            }{" "}
            non-image scientific file
            {ignoredFiles.length ===
            1
              ? ""
              : "s"}{" "}
            are not yet used directly
            by the image model.
          </p>
        )}
      </div>

      {/* Initial generation */}

      {!initialImage &&
        !loading && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-lg font-medium">
              Ready for the first draft
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Generate artwork from the
              approved scientific brief and
              publication-specific canvas.
            </p>

            <div className="mt-6">
              <PublicationAiPolicyNotice
                policy={
                  generationPolicy
                }
                loading={
                  generationPolicyLoading
                }
                error={
                  generationPolicyError
                }
                operationLabel="AI artwork generation"
              />
            </div>

            <button
              type="button"
              onClick={
                generateArtwork
              }
              disabled={
                loading ||
                generationPolicyLoading ||
                !generationPolicy ||
                generationPolicyBlocked
              }
              className="mt-7 rounded-full bg-cyan-300 px-7 py-3.5 font-medium text-black transition enabled:hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate first draft →
            </button>
          </div>
        )}

      {/* Loading */}

      {loading && (
        <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />

            <p className="text-sm text-slate-300">
              Generating artwork...
            </p>
          </div>
        </div>
      )}

      {/* Error */}

      {error && (
        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
          <p className="text-sm text-red-200">
            {
              error
            }
          </p>
        </div>
      )}

      {initialImage && (
        <>
          {/* Artwork + refinement */}

          <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
                <img
                  src={
                    initialImage
                  }
                  alt="Selected scientific artwork"
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="mt-5">
                <PublicationAiPolicyNotice
                  policy={
                    generationPolicy
                  }
                  loading={
                    generationPolicyLoading
                  }
                  error={
                    generationPolicyError
                  }
                  operationLabel="AI artwork generation"
                  compact
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    generateArtwork
                  }
                  disabled={
                    loading ||
                    generationPolicyLoading ||
                    !generationPolicy ||
                    generationPolicyBlocked
                  }
                  className="rounded-full border border-white/10 px-5 py-3 text-sm transition hover:border-cyan-400/40 disabled:opacity-40"
                >
                  + Generate new draft
                </button>

                <button
                  type="button"
                  onClick={
                    downloadOriginalArtwork
                  }
                  className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-slate-200"
                >
                  ↓ Original PNG
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.03] p-5">
                <p className="text-sm font-medium text-amber-100">
                  Scientific review required
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Verify that structures,
                  morphology, geometry,
                  interactions, materials
                  and other meaningful
                  scientific elements remain
                  consistent with the research.
                </p>
              </div>
            </div>

            <RefinementPanel
              currentImage={
                initialImage
              }

               publisher={
                publisher
              }

               journal={
                journal
              }

               artworkType={
                artworkType
              }
               
               manualPolicyConfirmed={
                manualPolicyConfirmed
              }
              scientificConstraints={
                brief.scientific_constraints
              }
              avoid={
                brief.avoid
              }
              referenceImages={
                encodedReferences
              }
              onRefined={
                handleRefined
              }
            />
          </div>

          {/* Journal validation */}

          <div className="mt-8">
            <JournalValidationPanel
              image={
                initialImage
              }
              publisher={
                publisher
              }
              journal={
                journal
              }
              artworkType={
                artworkType
              }
            />
          </div>

          {/* Crop */}

          <div className="mt-8">
            <PublicationCropPreview
              image={
                initialImage
              }
              publisher={
                publisher
              }
              journal={
                journal
              }
              artworkType={
                artworkType
              }
              onCropChange={
                handleCropChange
              }
            />
          </div>

          {/* Quality */}

          <div className="mt-8">
            <PublicationQualityPanel
              originalImage={
                initialImage
              }
              crop={
                publicationCrop
              }
              scientificConstraints={
                brief.scientific_constraints
              }
              avoid={
                brief.avoid
              }
              publisher={
                publisher
              }
              journal={
                journal
              }
              artworkType={
                artworkType
              }

              manualPolicyConfirmed={manualPolicyConfirmed}

              enhancedImage={
                enhancedImage
              }
              setEnhancedImage={
                setEnhancedImage
              }
              onEnhancedApprovalChange={
                setEnhancedApproved
              }
            />
          </div>

          {/* FINAL SERVER-SIDE EXPORT */}

          <div className="mt-8">
            <PublicationExportPanel
              originalImage={
                initialImage
              }
              enhancedImage={
                enhancedImage
              }
              enhancedApproved={
                enhancedApproved
              }
              crop={
                publicationCrop
              }
              qualityApproved={
                qualityApproved
              }
              publisher={
                publisher
              }
              journal={
                journal
              }
              artworkType={
                artworkType
              }
              selectedVersionId={
                selectedVersionId
              }
            />
          </div>

          {/* Version history */}

          <div className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
                  Version history
                </p>

                <h2 className="mt-2 text-2xl font-medium">
                  Compare your iterations
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                {
                  versions.length
                }{" "}
                version
                {versions.length ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {versions.map(
                (
                  version
                ) => {
                  const selected =
                    version.id ===
                    selectedVersionId;

                  return (
                    <button
                      type="button"
                      key={
                        version.id
                      }
                      onClick={() =>
                        selectVersion(
                          version
                        )
                      }
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        selected
                          ? "border-cyan-300 bg-cyan-400/[0.05]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="aspect-[2/3] overflow-hidden bg-black">
                        <img
                          src={
                            version.image
                          }
                          alt={`Artwork version ${version.id}`}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">
                            Version{" "}
                            {
                              version.id
                            }
                          </p>

                          {selected && (
                            <span className="text-xs text-cyan-300">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            version.label
                          }
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </>
      )}

      {/* Back */}

      <div className="mt-10">
        <button
          type="button"
          onClick={
            onBack
          }
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
        >
          ← Back to production brief
        </button>
      </div>
    </section>
  );
}

function fileToDataUrl(
  file:
    File
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          if (
            typeof reader.result !==
            "string"
          ) {
            reject(
              new Error(
                `Could not read ${file.name}.`
              )
            );

            return;
          }

          resolve(
            reader.result
          );
        };

      reader.onerror =
        () =>
          reject(
            new Error(
              `Could not read ${file.name}.`
            )
          );

      reader.readAsDataURL(
        file
      );
    }
  );
}

async function downloadSource(
  source:
    string,

  filename:
    string
) {
  try {
    const response =
      await fetch(
        source
      );

    const blob =
      await response.blob();

    const objectUrl =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      objectUrl;

    link.download =
      filename;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          objectUrl
        );
      },
      1000
    );
  } catch (error) {
    console.error(
      "Artwork download error:",
      error
    );
  }
}
