"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  PublicationCropSelection,
} from "./PublicationCropPreview";

import PublicationAiPolicyNotice from "./PublicationAiPolicyNotice";
import {
  useArtworkPersistence,
} from "./ArtworkPersistenceContext";

import {
  usePublicationAiPolicy,
} from "./usePublicationAiPolicy";

type PublicationQualityPanelProps = {
  originalImage: string;

  crop:
    PublicationCropSelection | null;

  scientificConstraints: string[];

  avoid: string[];

  publisher: string;

  journal: string;

  artworkType: string;

  manualPolicyConfirmed: boolean;

  enhancedImage:
    string | null;

  setEnhancedImage:
    (
      image:
        string | null
    ) => void;

  onEnhancedApprovalChange:
    (
      approved:
        boolean
    ) => void;
};

type EnhancementInfo = {
  targetWidth: number;

  targetHeight: number;

  enhancementWidth: number;

  enhancementHeight: number;
};

type JobState =
  | "idle"
  | "starting"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed";

export default function PublicationQualityPanel({
  originalImage,

  crop,

  scientificConstraints,

  avoid,

  publisher,

  journal,

  artworkType,

  manualPolicyConfirmed,

  enhancedImage,

  setEnhancedImage,

  onEnhancedApprovalChange,
}: PublicationQualityPanelProps) {
  const artworkPersistence =
    useArtworkPersistence();

  const [
    croppedPreview,
    setCroppedPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    cropPreviewLoading,
    setCropPreviewLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    enhancedApproved,
    setEnhancedApproved,
  ] =
    useState(false);

  const [
    enhancementInfo,
    setEnhancementInfo,
  ] =
    useState<EnhancementInfo | null>(
      null
    );

  const [
    jobState,
    setJobState,
  ] =
    useState<JobState>(
      "idle"
    );

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] =
    useState(0);

  /*
    Poll generation ID.

    Increasing this number cancels any
    existing polling loop logically.
  */

  const pollRunRef =
    useRef(0);

  /*
    Keep track of Blob URLs created by
    this component so old ones can be
    safely released.
  */

  const objectUrlRef =
    useRef<string | null>(
      null
    );

  const {
    policy:
      enhancementPolicy,

    loading:
      enhancementPolicyLoading,

    error:
      enhancementPolicyError,

    blocked:
      enhancementPolicyBlocked,
  } =
    usePublicationAiPolicy({
      publisher,
      journal,
      artworkType,

      aiUseType:
        "detail-enhancement",
    });

  const enhancing =
    jobState ===
      "starting" ||
    jobState ===
      "queued" ||
    jobState ===
      "in_progress";

  /*
    Cleanup generated Blob URL.
  */

  useEffect(() => {
    return () => {
      if (
        objectUrlRef.current
      ) {
        URL.revokeObjectURL(
          objectUrlRef.current
        );
      }

      pollRunRef.current +=
        1;
    };
  }, []);

  /*
    A new enhanced image needs
    new scientific approval.
  */

  useEffect(() => {
    setEnhancedApproved(
      false
    );

    onEnhancedApprovalChange(
      false
    );
  }, [
    enhancedImage,
    onEnhancedApprovalChange,
  ]);

  /*
    Prepare the approved crop at
    its native pixel resolution.

    No enlargement occurs here.
  */

  useEffect(() => {
    let cancelled =
      false;

    /*
      Any new crop invalidates
      the previous polling job.
    */

    pollRunRef.current +=
      1;

    setJobState(
      "idle"
    );

    setElapsedSeconds(
      0
    );

    setEnhancementInfo(
      null
    );

    async function prepareCrop() {
      if (
        !crop ||
        !crop.approved
      ) {
        setCroppedPreview(
          null
        );

        setError(
          ""
        );

        return;
      }

      try {
        setCropPreviewLoading(
          true
        );

        setError(
          ""
        );

        const preview =
          await createNativeCrop(
            originalImage,
            crop
          );

        if (
          !cancelled
        ) {
          setCroppedPreview(
            preview
          );
        }
      } catch (err) {
        console.error(
          err
        );

        if (
          !cancelled
        ) {
          setCroppedPreview(
            null
          );

          setError(
            err instanceof Error
              ? err.message
              : "Could not prepare the approved crop."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setCropPreviewLoading(
            false
          );
        }
      }
    }

    prepareCrop();

    return () => {
      cancelled =
        true;
    };
  }, [
    originalImage,
    crop,
  ]);

  /*
    Timer shown while background
    enhancement is running.
  */

  useEffect(() => {
    if (!enhancing) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setElapsedSeconds(
            (
              current
            ) =>
              current + 1
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    enhancing,
  ]);

  /*
    True resolution analysis.
  */

  const analysis =
    useMemo(() => {
      if (!crop) {
        return null;
      }

      const nativeCropWidth =
        crop.cropWidth;

      const nativeCropHeight =
        crop.cropHeight;

      const widthScale =
        crop.targetWidth /
        nativeCropWidth;

      const heightScale =
        crop.targetHeight /
        nativeCropHeight;

      const upscaleFactor =
        Math.max(
          widthScale,
          heightScale
        );

      const totalPixelScale =
        (
          crop.targetWidth *
          crop.targetHeight
        ) /
        (
          nativeCropWidth *
          nativeCropHeight
        );

      const nativeSufficient =
        widthScale <=
          1.001 &&
        heightScale <=
          1.001;

      let qualityLevel:
        | "native"
        | "minor-upscale"
        | "moderate-upscale"
        | "major-upscale";

      if (
        nativeSufficient
      ) {
        qualityLevel =
          "native";
      } else if (
        upscaleFactor <=
        1.5
      ) {
        qualityLevel =
          "minor-upscale";
      } else if (
        upscaleFactor <=
        2.5
      ) {
        qualityLevel =
          "moderate-upscale";
      } else {
        qualityLevel =
          "major-upscale";
      }

      const compatibleWidth =
        roundUpToMultipleOf16(
          crop.targetWidth
        );

      const compatibleHeight =
        roundUpToMultipleOf16(
          crop.targetHeight
        );

      return {
        nativeCropWidth,

        nativeCropHeight,

        upscaleFactor,

        totalPixelScale,

        nativeSufficient,

        qualityLevel,

        compatibleWidth,

        compatibleHeight,
      };
    }, [
      crop,
    ]);

  if (
    !crop ||
    !crop.approved
  ) {
    return (
      <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-300">
          Publication quality
        </p>

        <h2 className="mt-3 text-xl font-medium">
          Crop approval required
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Approve the publication crop
          first. CoverLab will then evaluate
          the real source pixels remaining
          inside the approved framing.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  /*
    Start background enhancement.
  */

  async function startEnhancement() {
    if (
      enhancementPolicyLoading
    ) {
      setError(
        "Please wait while CoverLab verifies the publication AI policy."
      );

      return;
    }

    if (
      !enhancementPolicy ||
      enhancementPolicyBlocked
    ) {
      setError(
        enhancementPolicy
          ?.message ||
          "AI detail enhancement cannot proceed until the publication AI policy has been verified."
      );

      return;
    }

    if (
      !croppedPreview ||
      !crop
    ) {
      setError(
        "The approved crop is not ready yet."
      );

      return;
    }

    const thisPollRun =
      pollRunRef.current +
      1;

    pollRunRef.current =
      thisPollRun;

    try {
      setError(
        ""
      );

      setJobState(
        "starting"
      );

      setElapsedSeconds(
        0
      );

      setEnhancedApproved(
        false
      );

      onEnhancedApprovalChange(
        false
      );

      /*
        Do not display an old candidate
        while creating a new one.
      */

      if (
        objectUrlRef.current
      ) {
        URL.revokeObjectURL(
          objectUrlRef.current
        );

        objectUrlRef.current =
          null;
      }

      setEnhancedImage(
        null
      );

      const response =
        await fetch(
          "/api/enhance-publication-artwork/start",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                croppedImage:
                  croppedPreview,

                targetWidth:
                  crop.targetWidth,

                targetHeight:
                  crop.targetHeight,

                scientificConstraints,

                avoid,

                publisher,

                journal,

                artworkType,

                manualPolicyConfirmed,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            `Could not start enhancement. HTTP ${response.status}.`
        );
      }

      if (
        !data?.responseId
      ) {
        throw new Error(
          "The enhancement start endpoint returned no response ID."
        );
      }

      setEnhancementInfo({
        targetWidth:
          data.targetWidth ??
          crop.targetWidth,

        targetHeight:
          data.targetHeight ??
          crop.targetHeight,

        enhancementWidth:
          data.enhancementWidth ??
          analysis?.compatibleWidth ??
          crop.targetWidth,

        enhancementHeight:
          data.enhancementHeight ??
          analysis?.compatibleHeight ??
          crop.targetHeight,
      });

      setJobState(
        data.status ===
          "queued"
          ? "queued"
          : "in_progress"
      );

      await pollEnhancement(
        data.responseId,
        thisPollRun
      );
    } catch (err) {
      console.error(
        err
      );

      if (
        pollRunRef.current ===
        thisPollRun
      ) {
        setJobState(
          "failed"
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while creating the enhanced candidate."
        );
      }
    }
  }

  /*
    Poll OpenAI background job through
    our short-lived status endpoint.
  */

  async function pollEnhancement(
    responseId: string,
    pollRun: number
  ) {
    /*
      120 checks × 2.5 sec
      = maximum ~5 minutes.
    */

    for (
      let attempt = 0;
      attempt < 120;
      attempt += 1
    ) {
      if (
        pollRunRef.current !==
        pollRun
      ) {
        return;
      }

      await sleep(
        2500
      );

      if (
        pollRunRef.current !==
        pollRun
      ) {
        return;
      }

      const response =
        await fetch(
          `/api/enhance-publication-artwork/status?id=${encodeURIComponent(
            responseId
          )}`,
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      /*
        Completed job returns raw PNG.
      */

      if (
        response.ok &&
        contentType.includes(
          "image/"
        )
      ) {
        const blob =
          await response.blob();

        if (
          blob.size ===
          0
        ) {
          throw new Error(
            "The completed enhancement returned an empty image."
          );
        }

        const objectUrl =
          URL.createObjectURL(
            blob
          );

        if (
          pollRunRef.current !==
          pollRun
        ) {
          URL.revokeObjectURL(
            objectUrl
          );

          return;
        }

        const completedCrop =
          crop;
        const completedAnalysis =
          analysis;

        if (
          !completedCrop ||
          !completedAnalysis
        ) {
          URL.revokeObjectURL(
            objectUrl
          );

          throw new Error(
            "Publication crop analysis is no longer available."
          );
        }

        if (artworkPersistence) {
          try {
            await artworkPersistence.persistVersion({
              image:
                objectUrl,
              operation:
                "enhancement",
              sourceVersionId:
                artworkPersistence.selectedVersionId,
              selectAfterSave:
                false,
              metadata: {
                label:
                  "Detail-enhanced candidate",
                providerResponseId:
                  responseId,
                targetWidth:
                  completedCrop.targetWidth,
                targetHeight:
                  completedCrop.targetHeight,
                enhancementWidth:
                  completedAnalysis.compatibleWidth,
                enhancementHeight:
                  completedAnalysis.compatibleHeight,
              },
            });
          } catch (persistError) {
            URL.revokeObjectURL(
              objectUrl
            );
            throw persistError;
          }
        }

        if (
          objectUrlRef.current
        ) {
          URL.revokeObjectURL(
            objectUrlRef.current
          );
        }

        objectUrlRef.current =
          objectUrl;

        setEnhancedImage(
          objectUrl
        );

        setJobState(
          "completed"
        );

        return;
      }

      /*
        Otherwise endpoint returns JSON
        containing job state.
      */

      const data =
        await readJsonResponse(
          response
        );

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            `Could not retrieve enhancement status. HTTP ${response.status}.`
        );
      }

      const status =
        data?.status;

      if (
        status ===
          "queued"
      ) {
        setJobState(
          "queued"
        );

        continue;
      }

      if (
        status ===
          "in_progress"
      ) {
        setJobState(
          "in_progress"
        );

        continue;
      }

      if (
        status ===
          "failed" ||
        status ===
          "cancelled" ||
        status ===
          "incomplete"
      ) {
        throw new Error(
          data?.error ||
            `Enhancement ended with status: ${status}`
        );
      }

      if (
        status ===
          "completed"
      ) {
        /*
          Normally completed returns PNG,
          so reaching this point is unexpected.
        */

        throw new Error(
          "The enhancement completed but no image payload was returned."
        );
      }
    }

    throw new Error(
      "Enhancement is taking longer than expected. Please try again."
    );
  }

  function handleApproval(
    approved: boolean
  ) {
    setEnhancedApproved(
      approved
    );

    onEnhancedApprovalChange(
      approved
    );
  }

  const qualityGatePassed =
    analysis.nativeSufficient ||
    (
      Boolean(
        enhancedImage
      ) &&
      enhancedApproved
    );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      {/* Header */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
            Publication quality
          </p>

          <h2 className="mt-3 text-xl font-medium">
            Resolution quality assessment
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            CoverLab evaluates genuine
            source pixels remaining after
            cropping rather than relying
            only on DPI metadata.
          </p>
        </div>

        <QualityBadge
          level={
            analysis.qualityLevel
          }
        />
      </div>

      {/* Resolution stats */}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Native cropped source"
          value={`${Math.round(
            analysis.nativeCropWidth
          )} × ${Math.round(
            analysis.nativeCropHeight
          )} px`}
        />

        <InfoCard
          label="Exact journal target"
          value={`${crop.targetWidth} × ${crop.targetHeight} px`}
        />

        <InfoCard
          label="Required linear scale"
          value={`${analysis.upscaleFactor.toFixed(
            2
          )}×`}
        />

        <InfoCard
          label="Target resolution"
          value={`${crop.targetDpi} dpi`}
        />
      </div>

      {/* Canvas information */}

      {!analysis.nativeSufficient && (
        <div className="mt-5 rounded-xl border border-violet-400/15 bg-violet-400/[0.03] p-5">
          <p className="text-sm font-medium text-violet-200">
            Enhancement canvas and journal
            target are different
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniSize
              title="AI enhancement canvas"
              value={`${analysis.compatibleWidth} × ${analysis.compatibleHeight} px`}
            />

            <MiniSize
              title="Exact journal export"
              value={`${crop.targetWidth} × ${crop.targetHeight} px`}
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            AI enhancement uses the nearest
            compatible rendering size. The
            final export stage will convert
            the approved candidate to the
            exact journal dimensions.
          </p>
        </div>
      )}

      {/* Crop preparation */}

      {cropPreviewLoading && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />

          <p className="text-sm text-slate-400">
            Preparing native-resolution
            approved crop...
          </p>
        </div>
      )}

      {/* Native quality */}

      {analysis.nativeSufficient && (
        <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
          <p className="font-medium text-emerald-300">
            ✓ Native resolution is sufficient
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            No AI enlargement is required
            for this publication target.
          </p>
        </div>
      )}

      {/* Enhancement needed */}

      {!analysis.nativeSufficient && (
        <>
          <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
            <p className="font-medium text-amber-300">
              ⚠ Native resolution is below
              the journal target
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Conventional resizing increases
              pixel count without restoring
              missing detail. CoverLab can
              create a detail-enhanced
              candidate for scientific review.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniSize
                title="Linear enlargement"
                value={`${analysis.upscaleFactor.toFixed(
                  2
                )}×`}
              />

              <MiniSize
                title="Pixel-count increase"
                value={`${analysis.totalPixelScale.toFixed(
                  2
                )}×`}
              />
            </div>
          </div>

          <div className="mt-6">
            <PublicationAiPolicyNotice
              policy={
                enhancementPolicy
              }
              loading={
                enhancementPolicyLoading
              }
              error={
                enhancementPolicyError
              }
              operationLabel="AI detail enhancement"
              compact
            />
          </div>

          {!enhancedImage && (
            <button
              type="button"
              onClick={
                startEnhancement
              }
              disabled={
                enhancing ||
                cropPreviewLoading ||
                !croppedPreview ||
                enhancementPolicyLoading ||
                !enhancementPolicy ||
                enhancementPolicyBlocked
              }
              className="mt-6 rounded-full bg-violet-300 px-7 py-3.5 font-medium text-black transition enabled:hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enhancing
                ? "Enhancement running..."
                : "Create detail-enhanced candidate →"}
            </button>
          )}
        </>
      )}

      {/* Background progress */}

      {enhancing && (
        <div className="mt-5 rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-5">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300 border-t-transparent" />

            <div>
              <p className="text-sm font-medium text-violet-200">
                {jobState ===
                "starting"
                  ? "Starting enhancement job..."
                  : jobState ===
                    "queued"
                    ? "Enhancement queued..."
                    : "Enhancing artwork..."}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {elapsedSeconds}s elapsed ·
                You can keep this page open
                while CoverLab checks progress
                in the background.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4">
          <p className="text-sm text-red-200">
            {error}
          </p>
        </div>
      )}

      {/* Enhanced result */}

      {enhancedImage &&
        !analysis.nativeSufficient && (
          <div className="mt-8">
            <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.03] p-5">
              <p className="text-xs uppercase tracking-widest text-violet-300">
                Detail-enhanced candidate
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Compare the enhanced image
                carefully against the approved
                cropped source. AI enhancement
                may subtly reconstruct small
                visual features.
              </p>

              {enhancementInfo && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniSize
                    title="AI rendered"
                    value={`${enhancementInfo.enhancementWidth} × ${enhancementInfo.enhancementHeight} px`}
                  />

                  <MiniSize
                    title="Exact final target"
                    value={`${enhancementInfo.targetWidth} × ${enhancementInfo.targetHeight} px`}
                  />
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <ComparisonImage
                title="Approved cropped source"
                image={
                  croppedPreview
                }
              />

              <ComparisonImage
                title="Enhanced candidate"
                image={
                  enhancedImage
                }
              />
            </div>

            <label
              className={`mt-5 flex cursor-pointer items-start gap-4 rounded-xl border p-5 ${
                enhancedApproved
                  ? "border-emerald-400/30 bg-emerald-400/[0.05]"
                  : "border-amber-300/20 bg-amber-300/[0.03]"
              }`}
            >
              <input
                type="checkbox"
                checked={
                  enhancedApproved
                }
                onChange={(e) =>
                  handleApproval(
                    e.target.checked
                  )
                }
                className="mt-1"
              />

              <div>
                <p className="text-sm font-medium text-white">
                  I scientifically approve
                  this enhanced candidate
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  I have compared it against
                  the approved source and
                  verified that meaningful
                  scientific structures,
                  morphology, identities,
                  geometry and relationships
                  have not been improperly
                  altered.
                </p>
              </div>
            </label>

            <button
              type="button"
              onClick={
                startEnhancement
              }
              disabled={
                enhancing ||
                !croppedPreview
              }
              className="mt-4 rounded-full border border-white/10 px-5 py-3 text-sm transition hover:border-violet-400/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↻ Create another enhanced
              candidate
            </button>
          </div>
        )}

      {/* Quality gate */}

      <div
        className={`mt-7 rounded-xl border p-5 ${
          qualityGatePassed
            ? "border-emerald-400/25 bg-emerald-400/[0.05]"
            : "border-amber-300/20 bg-amber-300/[0.03]"
        }`}
      >
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Resolution quality gate
        </p>

        <p
          className={`mt-3 font-medium ${
            qualityGatePassed
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        >
          {qualityGatePassed
            ? "✓ Resolution quality gate passed"
            : "⚠ Resolution quality approval pending"}
        </p>

        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
          Passing this check means the
          resolution requirement has been
          addressed. Final publication
          eligibility still depends on
          journal policy, crop approval,
          format and final export settings.
        </p>
      </div>
    </div>
  );
}

function QualityBadge({
  level,
}: {
  level:
    | "native"
    | "minor-upscale"
    | "moderate-upscale"
    | "major-upscale";
}) {
  if (
    level ===
    "native"
  ) {
    return (
      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-2 text-xs text-emerald-300">
        Native quality
      </span>
    );
  }

  if (
    level ===
    "minor-upscale"
  ) {
    return (
      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-4 py-2 text-xs text-cyan-300">
        Minor enhancement
      </span>
    );
  }

  if (
    level ===
    "moderate-upscale"
  ) {
    return (
      <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-4 py-2 text-xs text-amber-300">
        Enhancement needed
      </span>
    );
  }

  return (
    <span className="rounded-full border border-red-400/20 bg-red-400/[0.05] px-4 py-2 text-xs text-red-300">
      Major enlargement
    </span>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

function MiniSize({
  title,
  value,
}: {
  title: string;

  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-widest text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-sm text-slate-200">
        {value}
      </p>
    </div>
  );
}

function ComparisonImage({
  title,
  image,
}: {
  title: string;

  image:
    string | null;
}) {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
        {title}
      </p>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-auto w-full object-contain"
          />
        ) : (
          <div className="p-8 text-sm text-slate-500">
            Image unavailable.
          </div>
        )}
      </div>
    </div>
  );
}

async function createNativeCrop(
  imageSrc: string,

  crop:
    PublicationCropSelection
): Promise<string> {
  const image =
    await loadImage(
      imageSrc
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    Math.max(
      1,
      Math.round(
        crop.cropWidth
      )
    );

  canvas.height =
    Math.max(
      1,
      Math.round(
        crop.cropHeight
      )
    );

  const context =
    canvas.getContext(
      "2d"
    );

  if (!context) {
    throw new Error(
      "Could not create the native crop canvas."
    );
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    "high";

  context.drawImage(
    image,

    crop.cropX,
    crop.cropY,

    crop.cropWidth,
    crop.cropHeight,

    0,
    0,

    canvas.width,
    canvas.height
  );

  return canvas.toDataURL(
    "image/png",
    1
  );
}

function loadImage(
  src: string
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.onload =
        () =>
          resolve(
            image
          );

      image.onerror =
        () =>
          reject(
            new Error(
              "Could not load the artwork image."
            )
          );

      image.src =
        src;
    }
  );
}

async function readJsonResponse(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    throw new Error(
      `Server returned invalid JSON. HTTP ${response.status}.`
    );
  }
}

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (
      resolve
    ) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function roundUpToMultipleOf16(
  value: number
) {
  return (
    Math.ceil(
      value / 16
    ) * 16
  );
}
