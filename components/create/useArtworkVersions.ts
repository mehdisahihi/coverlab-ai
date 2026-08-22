"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";
import {
  ARTWORK_VERSION_BUCKET,
  ARTWORK_VERSION_MAX_BYTES,
  artworkVersionFromRow,
  type ArtworkVersionOperation,
  type ArtworkVersionRow,
  type StoredArtworkVersion,
} from "@/lib/storage/artworkVersions";

export const ARTWORK_VERSIONS_CHANGED_EVENT =
  "coverlab:artwork-versions-changed";

type SaveArtworkVersionInput = {
  image: string;
  operation: ArtworkVersionOperation;
  sourceVersionId?: string | null;
  metadata?: Record<string, unknown>;
};

type ArtworkVersionsState = {
  versions: StoredArtworkVersion[];
  loading: boolean;
  error: string | null;
  saveVersion:
    (
      input: SaveArtworkVersionInput
    ) => Promise<StoredArtworkVersion>;
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

function isOperation(
  value: unknown
): value is ArtworkVersionOperation {
  return (
    value === "generation" ||
    value === "refinement" ||
    value === "enhancement"
  );
}

function parseRow(
  value: unknown
): ArtworkVersionRow | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.project_id !== "string" ||
    !isOperation(value.operation) ||
    !(
      value.source_version_id === null ||
      typeof value.source_version_id === "string"
    ) ||
    typeof value.image_path !== "string" ||
    !isRecord(value.metadata) ||
    typeof value.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    project_id: value.project_id,
    operation: value.operation,
    source_version_id:
      value.source_version_id,
    image_path:
      value.image_path,
    metadata:
      value.metadata,
    created_at:
      value.created_at,
  };
}

function responseError(
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

async function readJson(
  response: Response
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function blobToDataUrl(
  blob: Blob
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result !==
          "string"
        ) {
          reject(
            new Error(
              "Could not decode stored artwork."
            )
          );
          return;
        }

        resolve(reader.result);
      };

      reader.onerror = () =>
        reject(
          new Error(
            "Could not decode stored artwork."
          )
        );

      reader.readAsDataURL(blob);
    }
  );
}

export function useArtworkVersions({
  projectId,
  ensureProject,
}: {
  projectId: string | null;
  ensureProject:
    () => Promise<string | null>;
}): ArtworkVersionsState {
  const [
    versions,
    setVersions,
  ] =
    useState<StoredArtworkVersion[]>([]);
  const [
    loading,
    setLoading,
  ] =
    useState(false);
  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const loadVersions =
    useCallback(
      async () => {
        if (!projectId) {
          setVersions([]);
          setLoading(false);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response =
            await fetch(
              `/api/projects/${encodeURIComponent(
                projectId
              )}/versions`,
              {
                method: "GET",
                cache: "no-store",
              }
            );
          const data =
            await readJson(response);

          if (!response.ok) {
            throw new Error(
              responseError(
                data,
                "Could not load artwork version history."
              )
            );
          }

          const rows =
            isRecord(data) &&
            Array.isArray(data.versions)
              ? data.versions
                  .map(parseRow)
                  .filter(
                    (
                      row
                    ): row is ArtworkVersionRow =>
                      row !== null
                  )
              : [];

          const supabase =
            createClient();

          const restored =
            await Promise.all(
              rows.map(
                async (row) => {
                  const {
                    data: blob,
                    error:
                      downloadError,
                  } =
                    await supabase.storage
                      .from(
                        ARTWORK_VERSION_BUCKET
                      )
                      .download(
                        row.image_path
                      );

                  if (
                    downloadError ||
                    !blob
                  ) {
                    throw new Error(
                      downloadError
                        ?.message ||
                        "Could not restore a private artwork version."
                    );
                  }

                  const image =
                    await blobToDataUrl(
                      blob
                    );

                  return artworkVersionFromRow(
                    row,
                    image
                  );
                }
              )
            );

          setVersions(restored);
        } catch (loadError) {
          setVersions([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load artwork version history."
          );
        } finally {
          setLoading(false);
        }
      },
      [projectId]
    );

  useEffect(
    () => {
      void loadVersions();

      function handleVersionsChanged() {
        void loadVersions();
      }

      window.addEventListener(
        ARTWORK_VERSIONS_CHANGED_EVENT,
        handleVersionsChanged
      );

      return () => {
        window.removeEventListener(
          ARTWORK_VERSIONS_CHANGED_EVENT,
          handleVersionsChanged
        );
      };
    },
    [loadVersions]
  );

  const saveVersion =
    useCallback(
      async (
        input: SaveArtworkVersionInput
      ) => {
        const activeProjectId =
          projectId ??
          (await ensureProject());

        if (!activeProjectId) {
          throw new Error(
            "Save the project before storing artwork versions."
          );
        }

        const sourceVersionId =
          input.sourceVersionId ??
          null;

        const intentResponse =
          await fetch(
            `/api/projects/${encodeURIComponent(
              activeProjectId
            )}/versions/upload-intent`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                operation:
                  input.operation,
                sourceVersionId,
              }),
            }
          );
        const intentData =
          await readJson(
            intentResponse
          );

        if (!intentResponse.ok) {
          throw new Error(
            responseError(
              intentData,
              "Could not prepare private artwork storage."
            )
          );
        }

        if (
          !isRecord(intentData) ||
          typeof intentData.versionId !==
            "string" ||
          typeof intentData.objectPath !==
            "string"
        ) {
          throw new Error(
            "CoverLab returned an invalid artwork storage intent."
          );
        }

        const imageResponse =
          await fetch(input.image);

        if (!imageResponse.ok) {
          throw new Error(
            "Could not read the generated artwork for private storage."
          );
        }

        const blob =
          await imageResponse.blob();

        if (
          blob.size <= 0 ||
          blob.size >
            ARTWORK_VERSION_MAX_BYTES
        ) {
          throw new Error(
            "Artwork version must be larger than 0 bytes and no more than 50 MB."
          );
        }

        const supabase =
          createClient();

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              ARTWORK_VERSION_BUCKET
            )
            .upload(
              intentData.objectPath,
              blob,
              {
                cacheControl:
                  "3600",
                contentType:
                  "image/png",
                upsert: false,
              }
            );

        if (uploadError) {
          throw new Error(
            uploadError.message
          );
        }

        const confirmResponse =
          await fetch(
            `/api/projects/${encodeURIComponent(
              activeProjectId
            )}/versions`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                versionId:
                  intentData.versionId,
                operation:
                  input.operation,
                sourceVersionId,
                imagePath:
                  intentData.objectPath,
                metadata: {
                  ...input.metadata,
                  sizeBytes:
                    blob.size,
                  mimeType:
                    "image/png",
                },
              }),
            }
          );
        const confirmData =
          await readJson(
            confirmResponse
          );

        if (!confirmResponse.ok) {
          await supabase.storage
            .from(
              ARTWORK_VERSION_BUCKET
            )
            .remove([
              intentData.objectPath,
            ]);

          throw new Error(
            responseError(
              confirmData,
              "Could not confirm the private artwork version."
            )
          );
        }

        if (
          !isRecord(confirmData) ||
          !isRecord(
            confirmData.version
          )
        ) {
          throw new Error(
            "CoverLab returned invalid artwork version metadata."
          );
        }

        const row =
          parseRow(
            confirmData.version
          );

        if (!row) {
          throw new Error(
            "CoverLab returned invalid artwork version metadata."
          );
        }

        const image =
          input.image.startsWith(
            "data:"
          )
            ? input.image
            : await blobToDataUrl(
                blob
              );

        const stored =
          artworkVersionFromRow(
            row,
            image
          );

        setVersions(
          (current) => [
            ...current.filter(
              (version) =>
                version.id !==
                stored.id
            ),
            stored,
          ].sort(
            (a, b) =>
              a.createdAt.localeCompare(
                b.createdAt
              )
          )
        );

        setError(null);

        return stored;
      },
      [
        projectId,
        ensureProject,
      ]
    );

  return {
    versions,
    loading,
    error,
    saveVersion,
  };
}
