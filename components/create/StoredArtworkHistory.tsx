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

  if (versions.length === 0) {
    return null;
  }

  function handleVersionClick(
    version: StoredArtworkVersion
  ) {
    setPreviewVersionId(
      version.id
    );

    if (
      version.operation !==
      "enhancement"
    ) {
      onSelect(version);
    }
  }

  return (
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
            Select any saved version to inspect it at a useful size. Generated and refined versions can become the active artwork. Enhancement results remain scientific-review candidates, but can be selected here for full preview and source comparison.
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
                className="rounded-full border border-cyan-300/30 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/[0.06]"
              >
                Make active artwork
              </button>
            )}
          </div>

          {previewVersion.operation ===
            "enhancement" &&
            sourceVersion ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <figure className="min-w-0">
                <figcaption className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                  Source artwork
                </figcaption>

                <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black p-2 sm:min-h-[460px]">
                  <img
                    src={sourceVersion.image}
                    alt="Source artwork before detail enhancement"
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              </figure>

              <figure className="min-w-0">
                <figcaption className="mb-3 text-xs uppercase tracking-[0.16em] text-amber-200/80">
                  Enhanced candidate
                </figcaption>

                <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-amber-300/20 bg-black p-2 sm:min-h-[460px]">
                  <img
                    src={previewVersion.image}
                    alt="Detail-enhanced artwork candidate"
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              </figure>
            </div>
          ) : (
            <div className="mt-6 flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black p-2 sm:min-h-[560px]">
              <img
                src={previewVersion.image}
                alt={`Artwork version ${previewIndex + 1} preview`}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>
          )}

          {previewVersion.operation ===
            "enhancement" && (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-amber-200/80">
              This candidate is available for visual comparison only. Selecting it here does not approve its scientific fidelity and does not replace the active source artwork. Publication quality approval must still be completed before export.
            </p>
          )}
        </div>
      )}

      <div className="mt-7 overflow-x-auto pb-3">
        <div className="grid min-w-max grid-flow-col auto-cols-[240px] gap-4 sm:auto-cols-[260px] lg:auto-cols-[280px]">
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
                <button
                  type="button"
                  key={version.id}
                  aria-pressed={previewing}
                  onClick={() =>
                    handleVersionClick(
                      version
                    )
                  }
                  className={`overflow-hidden rounded-2xl border text-left transition ${
                    previewing
                      ? "border-violet-300/70 bg-violet-300/[0.06]"
                      : active
                        ? "border-cyan-300/60 bg-cyan-300/[0.04]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <div className="flex h-[310px] items-center justify-center overflow-hidden bg-black p-2">
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

                    {isEnhancement && (
                      <p className="mt-2 text-xs leading-5 text-amber-200/75">
                        Click to compare with its source artwork.
                      </p>
                    )}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
