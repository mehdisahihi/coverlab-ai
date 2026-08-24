"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  StoredArtworkVersion,
} from "@/lib/storage/artworkVersions";

type Props = {
  versions: StoredArtworkVersion[];
  selectedVersionId: string | null;
  onSelect:
    (
      version: StoredArtworkVersion
    ) => void;
};

type DownloadFormat =
  | "PNG"
  | "TIFF";

function labelForVersion(
  version: StoredArtworkVersion,
  index: number
) {
  const metadataLabel =
    typeof version.metadata.label ===
    "string"
      ? version.metadata.label
      : null;

  if (metadataLabel) {
    return metadataLabel;
  }

  if (
    version.operation ===
    "refinement"
  ) {
    return `Refinement ${index + 1}`;
  }

  if (
    version.operation ===
    "enhancement"
  ) {
    return `Enhanced candidate ${index + 1}`;
  }

  return `Draft ${index + 1}`;
}

function operationLabel(
  version: StoredArtworkVersion
) {
  if (
    version.operation ===
    "refinement"
  ) {
    return "Refined";
  }

  if (
    version.operation ===
    "enhancement"
  ) {
    return "Enhanced candidate";
  }

  return "Generated";
}

function metadataDimension(
  version: StoredArtworkVersion
) {
  const width =
    version.metadata.targetWidth;
  const height =
    version.metadata.targetHeight;

  if (
    typeof width === "number" &&
    typeof height === "number"
  ) {
    return `${width} × ${height} px`;
  }

  return null;
}

function fallbackFilename(
  version: StoredArtworkVersion,
  index: number,
  format: DownloadFormat
) {
  const suffix =
    version.operation ===
      "generation"
      ? "generated"
      : version.operation ===
          "refinement"
        ? "refined"
        : "enhanced-candidate";

  const extension =
    format === "TIFF"
      ? "tif"
      : "png";

  return `coverlab-version-${index + 1}-${suffix}.${extension}`;
}

function filenameFromHeader(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const utf8Match =
    value.match(
      /filename\*=UTF-8''([^;]+)/i
    );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1]
      );
    } catch {
      return utf8Match[1];
    }
  }

  const basicMatch =
    value.match(
      /filename="?([^";]+)"?/i
    );

  return basicMatch?.[1] ??
    null;
}

function triggerBlobDownload(
  blob: Blob,
  filename: string
) {
  const objectUrl =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";

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
}

function FormatButton({
  format,
  busy,
  compact = false,
  onClick,
}: {
  format: DownloadFormat;
  busy: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={
        compact
          ? "rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200 transition enabled:hover:border-white/25 enabled:hover:bg-white/[0.04] disabled:cursor-wait disabled:opacity-50"
          : "rounded-full border border-white/15 px-4 py-2.5 text-sm text-white transition enabled:hover:border-white/30 enabled:hover:bg-white/[0.05] disabled:cursor-wait disabled:opacity-50"
      }
    >
      {busy
        ? "Preparing…"
        : `↓ ${format}`}
    </button>
  );
}

export default function StoredArtworkHistory({
  versions,
  selectedVersionId,
  onSelect,
}: Props) {
  const [
    previewVersionId,
    setPreviewVersionId,
  ] =
    useState<string | null>(
      null
    );

  const [
    viewerOpen,
    setViewerOpen,
  ] =
    useState(false);

  const [
    downloadKey,
    setDownloadKey,
  ] =
    useState<string | null>(
      null
    );

  const [
    downloadError,
    setDownloadError,
  ] =
    useState<string | null>(
      null
    );

  const previousLatestIdRef =
    useRef<string | null>(
      null
    );

  const latestVersionId =
    versions.length > 0
      ? versions[
          versions.length - 1
        ].id
      : null;

  useEffect(
    () => {
      if (!latestVersionId) {
        setPreviewVersionId(
          null
        );
        previousLatestIdRef.current =
          null;
        return;
      }

      const latestChanged =
        previousLatestIdRef.current !==
        latestVersionId;

      const previewStillExists =
        previewVersionId &&
        versions.some(
          (version) =>
            version.id ===
            previewVersionId
        );

      if (
        latestChanged ||
        !previewStillExists
      ) {
        setPreviewVersionId(
          latestVersionId
        );
      }

      previousLatestIdRef.current =
        latestVersionId;
    },
    [
      latestVersionId,
      previewVersionId,
      versions,
    ]
  );

  useEffect(
    () => {
      if (!viewerOpen) {
        return;
      }

      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      function handleKeyDown(
        event: KeyboardEvent
      ) {
        if (event.key === "Escape") {
          setViewerOpen(false);
        }
      }

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.body.style.overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [viewerOpen]
  );

  const previewVersion =
    useMemo(
      () =>
        versions.find(
          (version) =>
            version.id ===
            previewVersionId
        ) ??
        versions[
          versions.length - 1
        ] ??
        null,
      [
        previewVersionId,
        versions,
      ]
    );

  const previewIndex =
    previewVersion
      ? versions.findIndex(
          (version) =>
            version.id ===
            previewVersion.id
        )
      : -1;

  const sourceVersion =
    previewVersion
      ?.sourceVersionId
      ? versions.find(
          (version) =>
            version.id ===
            previewVersion.sourceVersionId
        ) ?? null
      : null;

  const sourceIndex =
    sourceVersion
      ? versions.findIndex(
          (version) =>
            version.id ===
            sourceVersion.id
        )
      : -1;

  if (versions.length === 0) {
    return null;
  }

  function handleVersionClick(
    version: StoredArtworkVersion
  ) {
    setPreviewVersionId(
      version.id
    );

    setViewerOpen(true);

    if (
      version.operation !==
      "enhancement"
    ) {
      onSelect(version);
    }
  }

  async function downloadVersion(
    version: StoredArtworkVersion,
    index: number,
    format: DownloadFormat
  ) {
    const key =
      `${version.id}:${format}`;

    if (downloadKey) {
      return;
    }

    try {
      setDownloadKey(key);
      setDownloadError(null);

      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            version.projectId
          )}/versions/${encodeURIComponent(
            version.id
          )}/download?format=${encodeURIComponent(
            format
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        let message =
          `Could not download ${format}. HTTP ${response.status}.`;

        try {
          const data =
            await response.json();

          if (
            data &&
            typeof data.error ===
              "string"
          ) {
            message =
              data.error;
          }
        } catch {
          /* keep fallback */
        }

        throw new Error(
          message
        );
      }

      const blob =
        await response.blob();

      if (blob.size === 0) {
        throw new Error(
          "The downloaded artwork file is empty."
        );
      }

      const filename =
        filenameFromHeader(
          response.headers.get(
            "Content-Disposition"
          )
        ) ??
        fallbackFilename(
          version,
          index,
          format
        );

      triggerBlobDownload(
        blob,
        filename
      );
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Could not download the artwork version."
      );
    } finally {
      setDownloadKey(null);
    }
  }

  function downloadButtons(
    version: StoredArtworkVersion,
    index: number,
    compact = false
  ) {
    return (
      <div className="flex flex-wrap gap-2">
        <FormatButton
          format="PNG"
          compact={compact}
          busy={
            downloadKey ===
            `${version.id}:PNG`
          }
          onClick={() => {
            void downloadVersion(
              version,
              index,
              "PNG"
            );
          }}
        />

        <FormatButton
          format="TIFF"
          compact={compact}
          busy={
            downloadKey ===
            `${version.id}:TIFF`
          }
          onClick={() => {
            void downloadVersion(
              version,
              index,
              "TIFF"
            );
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mt-12 w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
              Private version history
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Compare your saved iterations
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              All saved versions are shown in a responsive grid with no horizontal ribbon. Open any version for a large preview. Generated and refined versions can become the active artwork; enhancement results remain scientific-review candidates until publication-quality approval.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            {versions.length}{" "}
            version
            {versions.length === 1
              ? ""
              : "s"}
          </p>
        </div>

        {downloadError && (
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
            <p className="text-sm text-red-200">
              {downloadError}
            </p>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-5 text-slate-500">
          PNG and TIFF here are downloads of the saved version itself. TIFF is a real server-side image conversion, but it is not automatically a journal-ready submission file. Use Final publication export for journal dimensions, DPI, crop and format verification.
        </div>

        {previewVersion && (
          <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-medium text-white">
                    Version {previewIndex + 1}
                  </p>

                  {previewVersion.id ===
                    selectedVersionId &&
                    previewVersion.operation !==
                      "enhancement" && (
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/[0.06] px-3 py-1 text-xs text-cyan-200">
                      Active artwork
                    </span>
                  )}

                  {previewVersion.operation ===
                    "enhancement" && (
                    <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.05] px-3 py-1 text-xs text-amber-200">
                      Scientific-review candidate
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  {labelForVersion(
                    previewVersion,
                    previewIndex
                  )}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    {operationLabel(
                      previewVersion
                    )}
                  </span>

                  {metadataDimension(
                    previewVersion
                  ) && (
                    <span>
                      {metadataDimension(
                        previewVersion
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setViewerOpen(true)
                  }
                  className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200"
                >
                  ⛶ Open large viewer
                </button>

                {downloadButtons(
                  previewVersion,
                  previewIndex
                )}

                {previewVersion.operation !==
                  "enhancement" &&
                  previewVersion.id !==
                    selectedVersionId && (
                  <button
                    type="button"
                    onClick={() =>
                      onSelect(
                        previewVersion
                      )
                    }
                    className="rounded-full border border-cyan-300/30 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-300/[0.06]"
                  >
                    Make active artwork
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setViewerOpen(true)
              }
              className="mt-6 block w-full overflow-hidden rounded-2xl border border-white/10 bg-black text-left transition hover:border-white/25"
            >
              {previewVersion.operation ===
                "enhancement" &&
                sourceVersion ? (
                <div className="grid gap-px bg-white/10 md:grid-cols-2">
                  <figure className="min-w-0 bg-black p-3">
                    <figcaption className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                      Source artwork
                    </figcaption>

                    <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-xl bg-black sm:h-[520px]">
                      <img
                        src={sourceVersion.image}
                        alt="Source artwork before detail enhancement"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </figure>

                  <figure className="min-w-0 bg-black p-3">
                    <figcaption className="mb-3 text-xs uppercase tracking-[0.16em] text-amber-200/80">
                      Enhanced candidate
                    </figcaption>

                    <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-xl bg-black sm:h-[520px]">
                      <img
                        src={previewVersion.image}
                        alt="Detail-enhanced artwork candidate"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </figure>
                </div>
              ) : (
                <div className="flex h-[520px] items-center justify-center p-3 sm:h-[680px]">
                  <img
                    src={previewVersion.image}
                    alt={`Artwork version ${previewIndex + 1} preview`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </button>

            {previewVersion.operation ===
              "enhancement" &&
              sourceVersion &&
              sourceIndex >= 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.03] p-4">
                <p className="max-w-2xl text-sm leading-6 text-amber-200/80">
                  This candidate remains unapproved scientifically. You can inspect and download it, but publication-quality approval is still required before final export.
                </p>

                <div>
                  <p className="mb-2 text-xs text-slate-500">
                    Source version downloads
                  </p>
                  {downloadButtons(
                    sourceVersion,
                    sourceIndex,
                    true
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className="mt-7 grid gap-4"
          style={{
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          }}
        >
          {versions.map(
            (version, index) => {
              const active =
                version.id ===
                selectedVersionId;
              const previewing =
                version.id ===
                previewVersion?.id;
              const isEnhancement =
                version.operation ===
                "enhancement";

              return (
                <article
                  key={version.id}
                  className={`min-w-0 overflow-hidden rounded-2xl border transition ${
                    previewing
                      ? "border-violet-300/70 bg-violet-300/[0.06]"
                      : active
                        ? "border-cyan-300/60 bg-cyan-300/[0.04]"
                        : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={previewing}
                    onClick={() =>
                      handleVersionClick(
                        version
                      )
                    }
                    className="block w-full text-left transition hover:bg-white/[0.02]"
                  >
                    <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-black p-2">
                      <img
                        src={version.image}
                        alt={`Stored artwork version ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          Version {index + 1}
                        </p>

                        {previewing ? (
                          <span className="text-xs text-violet-200">
                            Previewing
                          </span>
                        ) : active ? (
                          <span className="text-xs text-cyan-300">
                            Active
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 min-h-10 text-xs leading-5 text-slate-400">
                        {labelForVersion(
                          version,
                          index
                        )}
                      </p>

                      <p className={`mt-2 text-[11px] uppercase tracking-widest ${
                        isEnhancement
                          ? "text-amber-300/70"
                          : "text-slate-600"
                      }`}>
                        {operationLabel(
                          version
                        )}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {isEnhancement
                          ? "Open large source comparison"
                          : "Open large preview"}
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-white/10 p-3">
                    {downloadButtons(
                      version,
                      index,
                      true
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </div>

      {viewerOpen &&
        previewVersion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Large artwork viewer for version ${previewIndex + 1}`}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex min-h-full w-full max-w-[1800px] flex-col p-3 sm:p-5 lg:p-7">
            <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur sm:p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-medium text-white sm:text-lg">
                    Version {previewIndex + 1}
                  </p>

                  {previewVersion.operation ===
                    "enhancement" && (
                    <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.06] px-3 py-1 text-xs text-amber-200">
                      Scientific-review candidate
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {labelForVersion(
                    previewVersion,
                    previewIndex
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {previewVersion.operation ===
                  "enhancement" &&
                  sourceVersion &&
                  sourceIndex >= 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 px-2 py-1">
                    <span className="pl-2 text-xs text-slate-500">
                      Source
                    </span>
                    {downloadButtons(
                      sourceVersion,
                      sourceIndex,
                      true
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 px-2 py-1">
                  <span className="pl-2 text-xs text-slate-500">
                    {previewVersion.operation ===
                      "enhancement"
                      ? "Enhanced"
                      : "Version"}
                  </span>
                  {downloadButtons(
                    previewVersion,
                    previewIndex,
                    true
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewerOpen(false)
                  }
                  className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200"
                >
                  Close ×
                </button>
              </div>
            </div>

            {previewVersion.operation ===
              "enhancement" &&
              sourceVersion ? (
              <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <figure className="flex min-h-[70vh] min-w-0 flex-col rounded-2xl border border-white/10 bg-black p-3 sm:p-4">
                  <figcaption className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <span>
                      Source artwork
                    </span>

                    <span className="text-slate-600">
                      Version {sourceIndex + 1}
                    </span>
                  </figcaption>

                  <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl bg-black">
                    <img
                      src={sourceVersion.image}
                      alt="Large source artwork before detail enhancement"
                      className="max-h-[calc(100vh-12rem)] max-w-full object-contain"
                    />
                  </div>
                </figure>

                <figure className="flex min-h-[70vh] min-w-0 flex-col rounded-2xl border border-amber-300/20 bg-black p-3 sm:p-4">
                  <figcaption className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-amber-200/80">
                    <span>
                      Enhanced candidate
                    </span>

                    {metadataDimension(
                      previewVersion
                    ) && (
                      <span className="text-amber-200/50">
                        {metadataDimension(
                          previewVersion
                        )}
                      </span>
                    )}
                  </figcaption>

                  <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl bg-black">
                    <img
                      src={previewVersion.image}
                      alt="Large detail-enhanced artwork candidate"
                      className="max-h-[calc(100vh-12rem)] max-w-full object-contain"
                    />
                  </div>
                </figure>
              </div>
            ) : (
              <div className="flex min-h-[78vh] flex-1 items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-black p-3 sm:p-5">
                <img
                  src={previewVersion.image}
                  alt={`Large artwork version ${previewIndex + 1}`}
                  className="max-h-[calc(100vh-10rem)] max-w-full object-contain"
                />
              </div>
            )}

            {previewVersion.operation ===
              "enhancement" && (
              <p className="mx-auto mt-4 max-w-4xl text-center text-xs leading-5 text-amber-200/70 sm:text-sm">
                This comparison viewer does not approve the enhancement scientifically. Review the candidate against its source, then complete publication-quality approval before final publication export.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
