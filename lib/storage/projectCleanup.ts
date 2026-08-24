import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  ARTWORK_VERSION_BUCKET,
} from "@/lib/storage/artworkVersions";
import {
  PROJECT_ASSET_BUCKET,
} from "@/lib/storage/projectAssets";

const STORAGE_DELETE_BATCH_SIZE =
  100;

const STORAGE_LIST_LIMIT =
  1000;

export type ProjectStorageCleanupResult = {
  projectAssetsDeleted: number;
  artworkVersionsDeleted: number;
};

async function deleteFolderObjects(
  supabase: SupabaseClient,
  bucket: string,
  folder: string
) {
  let deleted = 0;

  /*
   * Always list from offset 0 because every
   * successful remove changes the folder contents.
   * Advancing an offset while deleting would skip
   * objects that shift into earlier positions.
   */
  while (true) {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(bucket)
        .list(folder, {
          limit:
            STORAGE_LIST_LIMIT,
          offset: 0,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

    if (error) {
      throw new Error(
        `Could not list private ${bucket} objects for deletion: ${error.message}`
      );
    }

    const names =
      (data ?? [])
        .map(
          (item) =>
            item.name
        )
        .filter(
          (
            name
          ): name is string =>
            Boolean(name)
        );

    if (names.length === 0) {
      return deleted;
    }

    for (
      let index = 0;
      index < names.length;
      index +=
        STORAGE_DELETE_BATCH_SIZE
    ) {
      const paths =
        names
          .slice(
            index,
            index +
              STORAGE_DELETE_BATCH_SIZE
          )
          .map(
            (name) =>
              `${folder}/${name}`
          );

      const {
        data: removed,
        error: removeError,
      } =
        await supabase.storage
          .from(bucket)
          .remove(paths);

      if (removeError) {
        throw new Error(
          `Could not delete private ${bucket} objects: ${removeError.message}`
        );
      }

      /*
       * Supabase returns the deleted object rows.
       * Counting the response gives useful audit
       * information without trusting client input.
       */
      deleted +=
        removed?.length ??
        paths.length;
    }
  }
}

export async function deleteProjectStorage(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<ProjectStorageCleanupResult> {
  const folder =
    `${userId}/${projectId}`;

  const projectAssetsDeleted =
    await deleteFolderObjects(
      supabase,
      PROJECT_ASSET_BUCKET,
      folder
    );

  const artworkVersionsDeleted =
    await deleteFolderObjects(
      supabase,
      ARTWORK_VERSION_BUCKET,
      folder
    );

  return {
    projectAssetsDeleted,
    artworkVersionsDeleted,
  };
}
