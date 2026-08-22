export const ARTWORK_VERSION_BUCKET =
  "artwork-versions";

export const ARTWORK_VERSION_MAX_BYTES =
  50 * 1024 * 1024;

export type ArtworkVersionOperation =
  | "generation"
  | "refinement"
  | "enhancement";

export type StoredArtworkVersion = {
  id: string;
  projectId: string;
  operation: ArtworkVersionOperation;
  sourceVersionId: string | null;
  imagePath: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  image: string;
};

export type ArtworkVersionRow = {
  id: string;
  project_id: string;
  operation: ArtworkVersionOperation;
  source_version_id: string | null;
  image_path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function artworkVersionFromRow(
  row: ArtworkVersionRow,
  image: string
): StoredArtworkVersion {
  if (!row.image_path) {
    throw new Error(
      "Artwork version has no stored image path."
    );
  }

  return {
    id: row.id,
    projectId: row.project_id,
    operation: row.operation,
    sourceVersionId:
      row.source_version_id,
    imagePath: row.image_path,
    metadata:
      row.metadata ?? {},
    createdAt: row.created_at,
    image,
  };
}

export function expectedArtworkVersionPath(
  userId: string,
  projectId: string,
  versionId: string
) {
  return `${userId}/${projectId}/${versionId}.png`;
}
