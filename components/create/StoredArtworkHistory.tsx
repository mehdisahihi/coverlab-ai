"use client";

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

function VersionCardContent({
  version,
  index,
  selected,
}: {
  version: StoredArtworkVersion;
  index: number;
  selected: boolean;
}) {
  return (
    <>
      <div className="aspect-[2/3] overflow-hidden bg-black">
        <img
          src={version.image}
          alt={`Stored artwork version ${index + 1}`}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white">
            Version {index + 1}
          </p>

          {selected && (
            <span className="text-xs text-cyan-300">
              Selected
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-400">
          {labelForVersion(
            version,
            index
          )}
        </p>

        <p className="mt-2 text-[11px] uppercase tracking-widest text-slate-600">
          {operationLabel(
            version
          )}
        </p>

        {version.operation ===
          "enhancement" && (
          <p className="mt-2 text-xs leading-5 text-amber-200/80">
            Candidate only. Scientific quality approval must be reviewed again before export.
          </p>
        )}
      </div>
    </>
  );
}

export default function StoredArtworkHistory({
  versions,
  selectedVersionId,
  onSelect,
}: Props) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
            Private version history
          </p>

          <h2 className="mt-2 text-2xl font-medium">
            Compare your saved iterations
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            These artwork versions are stored privately with your project and are restored when you resume the workflow. Publication crop and scientific quality approvals are intentionally reviewed again after resume.
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {versions.map(
          (version, index) => {
            const selected =
              version.id ===
              selectedVersionId;
            const isEnhancement =
              version.operation ===
              "enhancement";
            const cardClass =
              `overflow-hidden rounded-2xl border text-left transition ${
                selected
                  ? "border-cyan-300 bg-cyan-400/[0.05]"
                  : "border-white/10 bg-white/[0.02]"
              }`;

            if (isEnhancement) {
              return (
                <div
                  key={version.id}
                  className={cardClass}
                >
                  <VersionCardContent
                    version={version}
                    index={index}
                    selected={false}
                  />
                </div>
              );
            }

            return (
              <button
                type="button"
                key={version.id}
                onClick={() =>
                  onSelect(version)
                }
                className={`${cardClass} hover:border-white/20`}
              >
                <VersionCardContent
                  version={version}
                  index={index}
                  selected={selected}
                />
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
