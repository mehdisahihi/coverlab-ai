"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type {
  ProjectAsset,
} from "@/lib/storage/projectAssets";

type ProjectAssetsState = {
  assets: ProjectAsset[];
  setAssets:
    Dispatch<
      SetStateAction<
        ProjectAsset[]
      >
    >;
  loading: boolean;
  error: string | null;
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

function parseAssets(
  value: unknown
): ProjectAsset[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is ProjectAsset =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.projectId === "string" &&
      item.bucketId === "project-assets" &&
      typeof item.objectPath === "string" &&
      typeof item.originalName === "string" &&
      typeof item.mimeType === "string" &&
      typeof item.sizeBytes === "number" &&
      typeof item.createdAt === "string"
  );
}

export function useProjectAssets(
  projectId: string | null
): ProjectAssetsState {
  const [
    assets,
    setAssets,
  ] =
    useState<ProjectAsset[]>([]);
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

  useEffect(
    () => {
      let cancelled = false;

      if (!projectId) {
        setAssets([]);
        setLoading(false);
        setError(null);
        return;
      }

      async function loadAssets() {
        setLoading(true);
        setError(null);

        try {
          const response =
            await fetch(
              `/api/projects/${encodeURIComponent(
                projectId
              )}/assets`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const data =
            (await response.json()) as unknown;

          if (!response.ok) {
            const message =
              isRecord(data) &&
              typeof data.error === "string"
                ? data.error
                : "Could not load scientific assets.";

            throw new Error(message);
          }

          if (cancelled) {
            return;
          }

          setAssets(
            isRecord(data)
              ? parseAssets(
                  data.assets
                )
              : []
          );
        } catch (loadError) {
          if (cancelled) {
            return;
          }

          console.error(
            "Project asset load error:",
            loadError
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load scientific assets."
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void loadAssets();

      return () => {
        cancelled = true;
      };
    },
    [projectId]
  );

  return {
    assets,
    setAssets,
    loading,
    error,
  };
}
