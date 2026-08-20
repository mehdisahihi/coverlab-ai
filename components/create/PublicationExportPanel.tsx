"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  normalizeArtworkType,
  resolvePublicationRules,
} from "../../lib/publicationRegistry";

import type {
  PublicationCropSelection,
} from "./PublicationCropPreview";

type RasterFormat =
  | "PNG"
  | "JPEG"
  | "TIFF";

type PublicationExportPanelProps = {
  originalImage: string;

  enhancedImage:
    string | null;

  enhancedApproved: boolean;

  crop:
    PublicationCropSelection | null;

  qualityApproved: boolean;

  publisher: string;

  journal: string;

  artworkType: string;

  selectedVersionId:
    number | null;
};

type VerificationResult = {
  width: number;

  height: number;

  dpi: number;

  format: string;

  policyStatus: string;

  sourceMode: string;

  bytes: number;
};

export default function PublicationExportPanel({
  originalImage,

  enhancedImage,

  enhancedApproved,

  crop,

  qualityApproved,

  publisher,

  journal,

  artworkType,

  selectedVersionId,
}: PublicationExportPanelProps) {
  const [
    exporting,
    setExporting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    verification,
    setVerification,
  ] =
    useState<VerificationResult | null>(
      null
    );

  const normalizedArtworkType =
    normalizeArtworkType(
      artworkType
    );

  const rules =
    resolvePublicationRules(
      publisher,
      journal,
      normalizedArtworkType
    );

  const profile =
    rules.exactProfile;

  const availableFormats =
    useMemo(() => {
      if (!profile) {
        return [];
      }

      const formats: RasterFormat[] =
        [];

      for (
        const rawFormat of
        profile.formats
      ) {
        const normalized =
          normalizeRasterFormat(
            rawFormat
          );

        if (
          normalized &&
          !formats.includes(
            normalized
          )
        ) {
          formats.push(
            normalized
          );
        }
      }

      return formats;
    }, [
      profile,
    ]);

  const [
    selectedFormat,
    setSelectedFormat,
  ] =
    useState<RasterFormat | null>(
      null
    );

  /*
    Choose a useful default format whenever
    the exact publication profile changes.

    Prefer TIFF where officially supported,
    otherwise PNG, then JPEG.
  */

  useEffect(() => {
    if (
      availableFormats.length ===
      0
    ) {
      setSelectedFormat(
        null
      );

      return;
    }

    if (
      availableFormats.includes(
        "TIFF"
      )
    ) {
      setSelectedFormat(
        "TIFF"
      );

      return;
    }

    if (
      availableFormats.includes(
        "PNG"
      )
    ) {
      setSelectedFormat(
        "PNG"
      );

      return;
    }

    setSelectedFormat(
      availableFormats[0]
    );
  }, [
    availableFormats,
  ]);

  /*
    A new input invalidates the previous
    export verification result.
  */

  useEffect(() => {
    setVerification(
      null
    );

    setError(
      ""
    );
  }, [
    originalImage,
    enhancedImage,
    enhancedApproved,
    crop,
    qualityApproved,
    publisher,
    journal,
    artworkType,
    selectedFormat,
  ]);

  const cropApproved =
    crop?.approved ===
    true;

  const policyRequiresAttention =
    rules.aiPolicy.status ===
      "not-allowed" ||
    rules.aiPolicy.status ===
      "manual-check";

  const hasExactProfile =
    Boolean(
      profile
    );

  const technicallyReady =
    hasExactProfile &&
    cropApproved &&
    qualityApproved &&
    Boolean(
      selectedFormat
    );

  const exportAllowed =
    technicallyReady;

  const sourceMode =
    enhancedImage &&
    enhancedApproved
      ? "enhanced"
      : "native";

  const statusTitle =
    getStatusTitle({
      hasExactProfile,

      cropApproved,

      qualityApproved,

      policyBlocked: false,

      policyStatus:
        rules.aiPolicy.status,
    });

  async function exportPublicationFile() {
    if (
      !exportAllowed ||
      !profile ||
      !crop ||
      !selectedFormat
    ) {
      return;
    }

    try {
      setExporting(
        true
      );

      setError(
        ""
      );

      setVerification(
        null
      );

      /*
        Choose the scientifically approved
        high-detail candidate when available.

        Otherwise use the original artwork
        plus the researcher-approved crop.
      */

      const sourceImage =
        sourceMode ===
          "enhanced" &&
        enhancedImage
          ? enhancedImage
          : originalImage;

      const sourceBlob =
        await fetchImageBlob(
          sourceImage
        );

      const formData =
        new FormData();

      formData.append(
        "image",
        sourceBlob,
        "coverlab-source.png"
      );

      formData.append(
        "publisher",
        publisher
      );

      formData.append(
        "journal",
        journal
      );

      formData.append(
        "artworkType",
        normalizedArtworkType
      );

      formData.append(
        "format",
        selectedFormat
      );

      formData.append(
        "sourceMode",
        sourceMode
      );

      formData.append(
        "version",
        `v${selectedVersionId ?? 1}`
      );

      /*
        Native artwork still requires
        server-side application of the
        approved crop.

        Enhanced image is already based
        on that approved framing.
      */

      if (
        sourceMode ===
        "native"
      ) {
        formData.append(
          "cropX",
          crop.cropX.toString()
        );

        formData.append(
          "cropY",
          crop.cropY.toString()
        );

        formData.append(
          "cropWidth",
          crop.cropWidth.toString()
        );

        formData.append(
          "cropHeight",
          crop.cropHeight.toString()
        );
      }

      const response =
        await fetch(
          "/api/publication-export",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      if (
        !response.ok
      ) {
        const data =
          await readErrorResponse(
            response
          );

        throw new Error(
          data ||
            `Publication export failed. HTTP ${response.status}.`
        );
      }

      const blob =
        await response.blob();

      if (
        blob.size ===
        0
      ) {
        throw new Error(
          "The publication export returned an empty file."
        );
      }

      const width =
        Number(
          response.headers.get(
            "X-CoverLab-Width"
          )
        );

      const height =
        Number(
          response.headers.get(
            "X-CoverLab-Height"
          )
        );

      const dpi =
        Number(
          response.headers.get(
            "X-CoverLab-DPI"
          )
        );

      const returnedFormat =
        response.headers.get(
          "X-CoverLab-Format"
        ) ||
        selectedFormat;

      const policyStatus =
        response.headers.get(
          "X-CoverLab-Policy-Status"
        ) ||
        rules.aiPolicy.status;

      const returnedSourceMode =
        response.headers.get(
          "X-CoverLab-Source-Mode"
        ) ||
        sourceMode;

      setVerification({
        width,

        height,

        dpi,

        format:
          returnedFormat,

        policyStatus,

        sourceMode:
          returnedSourceMode,

        bytes:
          blob.size,
      });

      const contentDisposition =
        response.headers.get(
          "Content-Disposition"
        );

      const fallbackFilename =
        buildFallbackFilename({
          journal,

          artworkType:
            normalizedArtworkType,

          width,

          height,

          dpi,

          format:
            returnedFormat,
        });

      const filename =
        parseFilename(
          contentDisposition
        ) ||
        fallbackFilename;

      downloadBlob(
        blob,
        filename
      );
    } catch (err) {
      console.error(
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to prepare the final publication file."
      );
    } finally {
      setExporting(
        false
      );
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
            Final publication export
          </p>

          <h2 className="mt-3 text-xl font-medium">
            Build the exact submission file
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            CoverLab will create the final
            raster file using the verified
            journal dimensions, output
            resolution and supported format.
          </p>
        </div>

        <StatusBadge
          blocked={
            false
          }
          ready={
            exportAllowed
          }
        />
      </div>

      {/* Target profile */}

      {profile ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label="Exact dimensions"
            value={`${profile.widthPx} × ${profile.heightPx} px`}
          />

          <InfoCard
            label="Resolution"
            value={`${profile.dpi} dpi`}
          />

          <InfoCard
            label="Source"
            value={
              sourceMode ===
                "enhanced"
                ? "Approved enhancement"
                : "Approved native crop"
            }
          />

          <InfoCard
            label="Rule level"
            value={
              profile.confidence ===
                "verified-journal"
                ? "Journal-specific"
                : "Publisher-level"
            }
          />
        </div>
      ) : (
        <div className="mt-7 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
          <p className="font-medium text-amber-300">
            Exact export profile unavailable
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            CoverLab will not invent final
            dimensions. The exact journal
            instructions must be verified
            before publication export can be
            enabled.
          </p>
        </div>
      )}

      {/* Policy */}

      <div
        className={`mt-5 rounded-xl border p-5 ${
          policyRequiresAttention
            ? "border-amber-300/20 bg-amber-300/[0.04]"
            : rules.aiPolicy.status ===
                "allowed"
              ? "border-emerald-400/20 bg-emerald-400/[0.04]"
              : "border-amber-300/20 bg-amber-300/[0.04]"
        }`}
      >
        <p className="text-xs uppercase tracking-widest text-slate-500">
          AI policy
        </p>

        <p
          className={`mt-3 font-medium ${
            policyRequiresAttention
              ? "text-amber-300"
              : rules.aiPolicy.status ===
                  "allowed"
                ? "text-emerald-300"
                : "text-amber-300"
          }`}
        >
          {policyLabel(
            rules.aiPolicy.status
          )}
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          {
            rules.aiPolicy.message
          }
        </p>

        {rules.aiPolicy
          .disclosureRequired ===
          true && (
          <div className="mt-4 rounded-lg border border-amber-300/15 bg-black/10 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-100">
              AI disclosure required
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Complete the required AI disclosure in the journal submission materials, cover caption, or other location specified by the publication.
            </p>
          </div>
        )}
      </div>

      {policyRequiresAttention && (
        <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
          <p className="text-sm font-medium text-amber-100">
            AI policy attention required
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            This policy controls generative AI operations. It does not, by itself, prevent CoverLab from building a technically compliant export from an artwork that is otherwise eligible for export.
          </p>
        </div>
      )}

      {/* Gates */}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Gate
          title="Exact profile"
          passed={
            hasExactProfile
          }
        />

        <Gate
          title="Crop"
          passed={
            cropApproved
          }
        />

        <Gate
          title="Resolution"
          passed={
            qualityApproved
          }
        />

        <Gate
          title="AI policy"
          passed={
            rules.aiPolicy.status !==
              "manual-check"
          }
          warning={
            rules.aiPolicy.status !==
              "allowed"
          }
        />
      </div>

      {/* Format */}

      {profile &&
        availableFormats.length >
          0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-white">
            Final raster format
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Only raster formats listed
            in the verified profile and
            supported by the export
            engine are shown.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {availableFormats.map(
              (format) => (
                <button
                  key={
                    format
                  }
                  type="button"
                  onClick={() =>
                    setSelectedFormat(
                      format
                    )
                  }
                  className={`rounded-full border px-5 py-2.5 text-sm transition ${
                    selectedFormat ===
                    format
                      ? "border-emerald-300 bg-emerald-300 text-black"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {
                    format
                  }
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Current status */}

      <div
        className={`mt-6 rounded-xl border p-5 ${
          exportAllowed
              ? "border-emerald-400/25 bg-emerald-400/[0.05]"
              : "border-amber-300/20 bg-amber-300/[0.03]"
        }`}
      >
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Export status
        </p>

        <p
          className={`mt-3 font-medium ${
            exportAllowed
                ? "text-emerald-300"
                : "text-amber-300"
          }`}
        >
          {statusTitle}
        </p>
      </div>

      {/* Export button */}

      <button
        type="button"
        disabled={
          !exportAllowed ||
          exporting
        }
        onClick={
          exportPublicationFile
        }
        className="mt-6 rounded-full bg-emerald-300 px-7 py-3.5 font-medium text-black transition enabled:hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {exporting
          ? "Building publication file..."
          : rules.aiPolicy.status ===
              "allowed"
            ? "↓ Download publication-ready candidate"
            : "↓ Download technical publication candidate"}
      </button>

      {/* Error */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4">
          <p className="text-sm text-red-200">
            {
              error
            }
          </p>
        </div>
      )}

      {/* Verification */}

      {verification && (
        <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
          <p className="text-xs uppercase tracking-widest text-emerald-300">
            Export verified
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat
              label="Pixels"
              value={`${verification.width} × ${verification.height}`}
            />

            <MiniStat
              label="DPI"
              value={`${verification.dpi}`}
            />

            <MiniStat
              label="Format"
              value={
                verification.format
              }
            />

            <MiniStat
              label="File size"
              value={
                formatBytes(
                  verification.bytes
                )
              }
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Export source:{" "}
            {verification.sourceMode ===
            "enhanced"
              ? "scientifically approved enhanced candidate"
              : "researcher-approved native crop"}
            .
          </p>
        </div>
      )}

      <p className="mt-6 max-w-3xl text-xs leading-5 text-slate-500">
        A successful technical export confirms
        the stored pixel dimensions, format and
        resolution metadata. It does not guarantee acceptance by the
        target publication. Current author
        instructions and any editorial permission
        or AI-disclosure requirements still apply.
      </p>
    </div>
  );
}

function normalizeRasterFormat(
  value: string
): RasterFormat | null {
  const normalized =
    value
      .trim()
      .toUpperCase();

  if (
    normalized === "PNG"
  ) {
    return "PNG";
  }

  if (
    normalized === "JPEG" ||
    normalized === "JPG"
  ) {
    return "JPEG";
  }

  if (
    normalized === "TIFF" ||
    normalized === "TIF"
  ) {
    return "TIFF";
  }

  return null;
}

function policyLabel(
  status:
    | "allowed"
    | "conditional"
    | "not-allowed"
    | "manual-check"
) {
  if (
    status === "allowed"
  ) {
    return "✓ Currently permitted";
  }

  if (
    status === "not-allowed"
  ) {
    return "✕ Publication export blocked";
  }

  if (
    status ===
    "conditional"
  ) {
    return "⚠ Conditionally permitted";
  }

  return "⚠ Manual journal verification required";
}

function getStatusTitle({
  hasExactProfile,
  cropApproved,
  qualityApproved,
  policyBlocked,
  policyStatus,
}: {
  hasExactProfile:
    boolean;

  cropApproved:
    boolean;

  qualityApproved:
    boolean;

  policyBlocked:
    boolean;

  policyStatus:
    | "allowed"
    | "conditional"
    | "not-allowed"
    | "manual-check";
}) {
  if (policyBlocked) {
    return "NOT ELIGIBLE FOR PUBLICATION EXPORT";
  }

  if (!hasExactProfile) {
    return "EXACT PUBLICATION PROFILE REQUIRED";
  }

  if (!cropApproved) {
    return "CROP APPROVAL REQUIRED";
  }

  if (!qualityApproved) {
    return "RESOLUTION QUALITY APPROVAL REQUIRED";
  }

  if (
    policyStatus ===
    "conditional"
  ) {
    return "TECHNICALLY READY — POLICY CONDITIONS REMAIN";
  }

  if (
    policyStatus ===
    "manual-check"
  ) {
    return "TECHNICALLY READY — MANUAL POLICY CHECK REQUIRED";
  }

  return "READY TO BUILD PUBLICATION CANDIDATE";
}

function StatusBadge({
  blocked,
  ready,
}: {
  blocked:
    boolean;

  ready:
    boolean;
}) {
  if (blocked) {
    return (
      <span className="rounded-full border border-red-400/20 bg-red-400/[0.05] px-4 py-2 text-xs text-red-300">
        Export blocked
      </span>
    );
  }

  if (ready) {
    return (
      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-2 text-xs text-emerald-300">
        Export ready
      </span>
    );
  }

  return (
    <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-4 py-2 text-xs text-amber-300">
      Checks pending
    </span>
  );
}

function Gate({
  title,
  passed,
  warning = false,
}: {
  title:
    string;

  passed:
    boolean;

  warning?:
    boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        !passed
          ? "border-red-400/15 bg-red-400/[0.03]"
          : warning
            ? "border-amber-300/20 bg-amber-300/[0.03]"
            : "border-emerald-400/20 bg-emerald-400/[0.04]"
      }`}
    >
      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p
        className={`mt-2 text-sm font-medium ${
          !passed
            ? "text-red-300"
            : warning
              ? "text-amber-300"
              : "text-emerald-300"
        }`}
      >
        {!passed
          ? "✕ Blocked"
          : warning
            ? "⚠ Attention"
            : "✓ Passed"}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
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

function MiniStat({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-widest text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm text-slate-200">
        {value}
      </p>
    </div>
  );
}

async function fetchImageBlob(
  imageSource: string
) {
  const response =
    await fetch(
      imageSource
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "Could not read the selected artwork for final export."
    );
  }

  const blob =
    await response.blob();

  if (
    blob.size === 0
  ) {
    throw new Error(
      "The selected artwork is empty."
    );
  }

  return blob;
}

async function readErrorResponse(
  response: Response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    try {
      const data =
        await response.json();

      return (
        data?.error ||
        ""
      );
    } catch {
      return "";
    }
  }

  try {
    return (
      await response.text()
    );
  } catch {
    return "";
  }
}

function parseFilename(
  contentDisposition:
    string | null
) {
  if (!contentDisposition) {
    return null;
  }

  const match =
    contentDisposition.match(
      /filename="([^"]+)"/i
    );

  return (
    match?.[1] ||
    null
  );
}

function buildFallbackFilename({
  journal,
  artworkType,
  width,
  height,
  dpi,
  format,
}: {
  journal: string;

  artworkType: string;

  width: number;

  height: number;

  dpi: number;

  format: string;
}) {
  const extension =
    format === "TIFF"
      ? "tif"
      : format ===
          "JPEG"
        ? "jpg"
        : "png";

  const safeJournal =
    journal
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    "publication";

  const safeArtwork =
    artworkType
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return `coverlab-${safeJournal}-${safeArtwork}-${width}x${height}-${dpi}dpi.${extension}`;
}

function downloadBlob(
  blob: Blob,
  filename: string
) {
  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

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
        url
      );
    },
    1000
  );
}

function formatBytes(
  bytes: number
) {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}
