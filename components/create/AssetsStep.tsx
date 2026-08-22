"use client";

import {
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";
import {
  fileExtension,
  isAllowedProjectAssetExtension,
  isModelReferenceAsset,
  PROJECT_ASSET_BUCKET,
  PROJECT_ASSET_MAX_BYTES,
  type ProjectAsset,
} from "@/lib/storage/projectAssets";

type AssetsStepProps = {
  assets: ProjectAsset[];
  setAssets:
    Dispatch<
      SetStateAction<ProjectAsset[]>
    >;
  projectId: string | null;
  ensureProject:
    () => Promise<string | null>;
  assetsLoading: boolean;
  assetsLoadError: string | null;
  notes: string;
  setNotes: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

type UploadIntent = {
  assetId: string;
  objectPath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function errorMessage(
  data: unknown,
  fallback: string
) {
  return (
    isRecord(data) &&
    typeof data.error === "string"
      ? data.error
      : fallback
  );
}

export default function AssetsStep({
  assets,
  setAssets,
  projectId,
  ensureProject,
  assetsLoading,
  assetsLoadError,
  notes,
  setNotes,
  onBack,
  onContinue,
}: AssetsStepProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const [
    uploading,
    setUploading,
  ] =
    useState(false);
  const [
    uploadError,
    setUploadError,
  ] =
    useState<string | null>(null);
  const [
    removingAssetId,
    setRemovingAssetId,
  ] =
    useState<string | null>(null);

  async function uploadFile(
    file: File,
    activeProjectId: string
  ) {
    const extension =
      fileExtension(file.name);

    if (
      !extension ||
      !isAllowedProjectAssetExtension(
        extension
      )
    ) {
      throw new Error(
        `${file.name}: unsupported scientific asset type.`
      );
    }

    if (
      file.size <= 0 ||
      file.size >
        PROJECT_ASSET_MAX_BYTES
    ) {
      throw new Error(
        `${file.name}: files must be larger than 0 bytes and no more than 25 MB.`
      );
    }

    const intentResponse =
      await fetch(
        `/api/projects/${encodeURIComponent(
          activeProjectId
        )}/assets/upload-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        }
      );

    const intentData =
      (await intentResponse.json()) as unknown;

    if (!intentResponse.ok) {
      throw new Error(
        errorMessage(
          intentData,
          `Could not prepare ${file.name} for upload.`
        )
      );
    }

    if (
      !isRecord(intentData) ||
      typeof intentData.assetId !==
        "string" ||
      typeof intentData.objectPath !==
        "string"
    ) {
      throw new Error(
        `CoverLab returned an invalid upload intent for ${file.name}.`
      );
    }

    const intent: UploadIntent = {
      assetId:
        intentData.assetId,
      objectPath:
        intentData.objectPath,
      originalName:
        file.name,
      mimeType:
        file.type,
      sizeBytes:
        file.size,
    };

    const supabase =
      createClient();

    const {
      error: storageError,
    } =
      await supabase.storage
        .from(PROJECT_ASSET_BUCKET)
        .upload(
          intent.objectPath,
          file,
          {
            cacheControl: "3600",
            contentType:
              file.type ||
              "application/octet-stream",
            upsert: false,
          }
        );

    if (storageError) {
      throw new Error(
        `${file.name}: ${storageError.message}`
      );
    }

    const confirmResponse =
      await fetch(
        `/api/projects/${encodeURIComponent(
          activeProjectId
        )}/assets`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(intent),
        }
      );

    const confirmData =
      (await confirmResponse.json()) as unknown;

    if (!confirmResponse.ok) {
      await supabase.storage
        .from(PROJECT_ASSET_BUCKET)
        .remove([
          intent.objectPath,
        ]);

      throw new Error(
        errorMessage(
          confirmData,
          `Could not save ${file.name} to the project.`
        )
      );
    }

    if (
      !isRecord(confirmData) ||
      !isRecord(confirmData.asset)
    ) {
      throw new Error(
        `CoverLab returned invalid asset metadata for ${file.name}.`
      );
    }

    const asset =
      confirmData.asset as unknown as ProjectAsset;

    setAssets(
      (current) => [
        ...current.filter(
          (item) =>
            item.id !== asset.id
        ),
        asset,
      ]
    );
  }

  async function handleFiles(
    selectedFiles: FileList | null
  ) {
    if (
      !selectedFiles ||
      selectedFiles.length === 0 ||
      uploading
    ) {
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const activeProjectId =
        projectId ??
        (await ensureProject());

      if (!activeProjectId) {
        throw new Error(
          "Save the project before uploading scientific assets."
        );
      }

      for (
        const file of
        Array.from(selectedFiles)
      ) {
        await uploadFile(
          file,
          activeProjectId
        );
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not upload the scientific asset."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function removeAsset(
    asset: ProjectAsset
  ) {
    if (
      removingAssetId ||
      !projectId
    ) {
      return;
    }

    setRemovingAssetId(
      asset.id
    );
    setUploadError(null);

    try {
      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/assets/${encodeURIComponent(
            asset.id
          )}`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        let data: unknown = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        throw new Error(
          errorMessage(
            data,
            `Could not remove ${asset.originalName}.`
          )
        );
      }

      setAssets(
        (current) =>
          current.filter(
            (item) =>
              item.id !== asset.id
          )
      );
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not remove the scientific asset."
      );
    } finally {
      setRemovingAssetId(null);
    }
  }

  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-300">
        STEP 3 OF 8
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Add your scientific assets
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Add the scientific material you want the final artwork to respect or reference. Files are stored privately with your project and remain available when you resume the workflow.
      </p>

      <div className="mt-10 space-y-7">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.svg,.tif,.tiff,.pdb,.gro,.mol,.mol2,.sdf,.pdf"
          className="hidden"
          onChange={(event) => {
            void handleFiles(
              event.target.files
            );
          }}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.025] px-6 py-10 text-center transition enabled:hover:border-cyan-400/50 enabled:hover:bg-cyan-400/[0.03] disabled:cursor-wait disabled:opacity-60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xl">
            {uploading ? "…" : "+"}
          </div>

          <p className="mt-4 font-medium">
            {uploading
              ? "Uploading to private storage…"
              : "Add figures or scientific files"}
          </p>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            PNG, JPEG, WebP, SVG, TIFF, PDF, PDB/GRO structures and common molecular files. Maximum 25 MB per file.
          </p>
        </button>

        {(uploadError ||
          assetsLoadError) && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-200">
            {uploadError ??
              assetsLoadError}
          </div>
        )}

        {assetsLoading && (
          <p className="text-sm text-slate-500">
            Loading saved scientific assets…
          </p>
        )}

        {assets.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Saved assets ({assets.length})
            </p>

            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">
                    {asset.originalName}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>
                      {formatFileSize(
                        asset.sizeBytes
                      )}
                    </span>
                    <span>
                      Private storage
                    </span>
                    {isModelReferenceAsset(
                      asset
                    ) && (
                      <span className="text-cyan-300">
                        AI reference eligible
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    removingAssetId ===
                    asset.id
                  }
                  onClick={() => {
                    void removeAsset(
                      asset
                    );
                  }}
                  className="shrink-0 text-sm text-slate-500 transition enabled:hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
                >
                  {removingAssetId ===
                  asset.id
                    ? "Removing…"
                    : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Instructions for these assets
            <span className="ml-2 font-normal text-slate-500">
              Optional
            </span>
          </label>

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            rows={5}
            placeholder="Example: Preserve the actual protein structure. Use Figure 3 only as scientific reference. Emphasize the ligand-binding region."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 leading-7 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />
        </div>

        <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.03] p-5">
          <p className="text-sm font-medium text-amber-100">
            Scientific asset control
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            PNG, JPEG and WebP files up to 8 MB can be supplied directly to the image model as reference material. Other scientific files are preserved with the project but are not yet passed directly to the image model.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
          >
            ← Back
          </button>

          <button
            type="button"
            disabled={uploading}
            onClick={onContinue}
            className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition enabled:hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
          >
            Continue to visual direction →
          </button>
        </div>
      </div>
    </section>
  );
}

function formatFileSize(
  bytes: number
) {
  if (bytes < 1024) {
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
