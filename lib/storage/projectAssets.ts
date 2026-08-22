export const PROJECT_ASSET_BUCKET =
  "project-assets";

export const PROJECT_ASSET_MAX_BYTES =
  25 * 1024 * 1024;

export const MODEL_REFERENCE_MAX_BYTES =
  8 * 1024 * 1024;

export const PROJECT_ASSET_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "tif",
  "tiff",
  "pdb",
  "gro",
  "mol",
  "mol2",
  "sdf",
  "pdf",
] as const;

export const MODEL_REFERENCE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type ProjectAsset = {
  id: string;
  projectId: string;
  bucketId: typeof PROJECT_ASSET_BUCKET;
  objectPath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ProjectAssetRow = {
  id: string;
  project_id: string;
  bucket_id: string;
  object_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export function projectAssetFromRow(
  row: ProjectAssetRow
): ProjectAsset {
  return {
    id: row.id,
    projectId: row.project_id,
    bucketId: PROJECT_ASSET_BUCKET,
    objectPath: row.object_path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    createdAt: row.created_at,
  };
}

export function fileExtension(
  fileName: string
) {
  const trimmed = fileName.trim();
  const dot = trimmed.lastIndexOf(".");

  if (
    dot <= 0 ||
    dot === trimmed.length - 1
  ) {
    return "";
  }

  return trimmed
    .slice(dot + 1)
    .toLowerCase();
}

export function isAllowedProjectAssetExtension(
  extension: string
) {
  return (
    PROJECT_ASSET_EXTENSIONS as readonly string[]
  ).includes(extension.toLowerCase());
}

export function isModelReferenceAsset(
  asset: Pick<
    ProjectAsset,
    "mimeType" | "sizeBytes"
  >
) {
  return (
    (
      MODEL_REFERENCE_MIME_TYPES as readonly string[]
    ).includes(asset.mimeType) &&
    asset.sizeBytes <=
      MODEL_REFERENCE_MAX_BYTES
  );
}
