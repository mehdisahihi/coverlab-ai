import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  ARTWORK_VERSION_BUCKET,
} from "@/lib/storage/artworkVersions";
import {
  PROJECT_ASSET_BUCKET,
} from "@/lib/storage/projectAssets";

export const STALE_STORAGE_ORPHAN_AGE_MS =
  24 * 60 * 60 * 1000;

const LIST_PAGE_SIZE = 100;
const REMOVE_BATCH_SIZE = 100;

type CleanupResult = {
  projectAssetsRemoved: number;
  artworkVersionsRemoved: number;
};

type StorageListItem = {
  name: string;
  created_at?: string | null;
};

async function listProjectObjects(
  supabase: SupabaseClient,
  bucket: string,
  folder: string
): Promise<StorageListItem[]> {
  const items: StorageListItem[] = [];
  let offset = 0;

  while (true) {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: LIST_PAGE_SIZE,
          offset,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

    if (error) {
      throw new Error(
        `Could not inspect ${bucket}: ${error.message}`
      );
    }

    const page =
      (data ?? []) as StorageListItem[];

    items.push(...page);

    if (
      page.length <
      LIST_PAGE_SIZE
    ) {
      break;
    }

    offset += page.length;
  }

  return items;
}

function isOlderThan(
  createdAt: string | null | undefined,
  cutoffMs: number
) {
  if (!createdAt) {
    return false;
  }

  const timestamp =
    Date.parse(createdAt);

  return (
    Number.isFinite(timestamp) &&
    timestamp < cutoffMs
  );
}

async function removePaths(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[]
) {
  for (
    let start = 0;
    start < paths.length;
    start += REMOVE_BATCH_SIZE
  ) {
    const batch =
      paths.slice(
        start,
        start + REMOVE_BATCH_SIZE
      );

    const {
      error,
    } =
      await supabase.storage
        .from(bucket)
        .remove(batch);

    if (error) {
      throw new Error(
        `Could not remove stale ${bucket} objects: ${error.message}`
      );
    }
  }
}

export async function cleanupStaleProjectStorageOrphans({
  supabase,
  userId,
  projectId,
  nowMs = Date.now(),
}: {
  supabase: SupabaseClient;
  userId: string;
  projectId: string;
  nowMs?: number;
}): Promise<CleanupResult> {
  const folder =
    `${userId}/${projectId}`;
  const cutoffMs =
    nowMs -
    STALE_STORAGE_ORPHAN_AGE_MS;

  const [
    assetRowsResult,
    versionRowsResult,
    projectAssetObjects,
    artworkVersionObjects,
  ] = await Promise.all([
    supabase
      .from("project_assets")
      .select("object_path")
      .eq("project_id", projectId)
      .eq("user_id", userId),
    supabase
      .from("project_versions")
      .select("image_path")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .not("image_path", "is", null),
    listProjectObjects(
      supabase,
      PROJECT_ASSET_BUCKET,
      folder
    ),
    listProjectObjects(
      supabase,
      ARTWORK_VERSION_BUCKET,
      folder
    ),
  ]);

  if (assetRowsResult.error) {
    throw new Error(
      `Could not inspect project asset metadata: ${assetRowsResult.error.message}`
    );
  }

  if (versionRowsResult.error) {
    throw new Error(
      `Could not inspect artwork version metadata: ${versionRowsResult.error.message}`
    );
  }

  const referencedProjectAssets =
    new Set(
      (assetRowsResult.data ?? [])
        .map(
          (row) =>
            row.object_path
        )
        .filter(
          (path): path is string =>
            typeof path === "string" &&
            path.length > 0
        )
    );

  const referencedArtworkVersions =
    new Set(
      (versionRowsResult.data ?? [])
        .map(
          (row) =>
            row.image_path
        )
        .filter(
          (path): path is string =>
            typeof path === "string" &&
            path.length > 0
        )
    );

  const staleProjectAssetPaths =
    projectAssetObjects
      .filter(
        (item) =>
          item.name &&
          isOlderThan(
            item.created_at,
            cutoffMs
          )
      )
      .map(
        (item) =>
          `${folder}/${item.name}`
      )
      .filter(
        (path) =>
          !referencedProjectAssets.has(
            path
          )
      );

  const staleArtworkVersionPaths =
    artworkVersionObjects
      .filter(
        (item) =>
          item.name &&
          isOlderThan(
            item.created_at,
            cutoffMs
          )
      )
      .map(
        (item) =>
          `${folder}/${item.name}`
      )
      .filter(
        (path) =>
          !referencedArtworkVersions.has(
            path
          )
      );

  await removePaths(
    supabase,
    PROJECT_ASSET_BUCKET,
    staleProjectAssetPaths
  );

  await removePaths(
    supabase,
    ARTWORK_VERSION_BUCKET,
    staleArtworkVersionPaths
  );

  return {
    projectAssetsRemoved:
      staleProjectAssetPaths.length,
    artworkVersionsRemoved:
      staleArtworkVersionPaths.length,
  };
}
