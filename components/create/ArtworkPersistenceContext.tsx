"use client";

import {
  createContext,
  useContext,
} from "react";

import type {
  ArtworkVersionOperation,
  StoredArtworkVersion,
} from "@/lib/storage/artworkVersions";

export type PersistArtworkVersionInput = {
  image: string;
  operation: ArtworkVersionOperation;
  sourceVersionId?: string | null;
  selectAfterSave?: boolean;
  metadata?: Record<string, unknown>;
};

type ArtworkPersistenceContextValue = {
  selectedVersionId: string | null;
  persistVersion:
    (
      input: PersistArtworkVersionInput
    ) => Promise<StoredArtworkVersion>;
};

const ArtworkPersistenceContext =
  createContext<ArtworkPersistenceContextValue | null>(
    null
  );

export const ArtworkPersistenceProvider =
  ArtworkPersistenceContext.Provider;

export function useArtworkPersistence() {
  return useContext(
    ArtworkPersistenceContext
  );
}
