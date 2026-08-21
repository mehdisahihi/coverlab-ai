"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type PersistedCreateState = {
  assetNotes: string;
  visualStyle: string;
  visualEmphasis: string;
  visualMood: string;
  visualNotes: string;
  conceptResult: unknown | null;
  selectedConcept: unknown | null;
  artRealism: string;
  artFreedom: string;
  artComposition: string;
  artColorDirection: string;
  preserveAssets: boolean;
  artNotes: string;
  productionBrief: unknown | null;
};

export type ProjectSnapshot = {
  researchTitle: string;
  researchAbstract: string;
  researchKeywords: string;
  publisher: string;
  journal: string;
  artworkType: string;
  currentStep: number;
  state: PersistedCreateState;
};

export type HydratedProject = {
  step: number;
  title: string;
  abstract: string;
  keywords: string;
  publisher: string;
  journal: string;
  artworkType: string;
  state: PersistedCreateState;
};

type PersistenceStatus =
  | "loading"
  | "idle"
  | "saving"
  | "saved"
  | "error";

type PendingSave = {
  serialized: string;
  snapshot: ProjectSnapshot;
};

type ProjectRow = {
  id?: unknown;
  research_title?: unknown;
  research_abstract?: unknown;
  research_keywords?: unknown;
  publisher?: unknown;
  journal?: unknown;
  artwork_type?: unknown;
  current_step?: unknown;
  state?: unknown;
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

function asString(
  value: unknown
) {
  return typeof value === "string"
    ? value
    : "";
}

function asNullableValue(
  value: unknown
) {
  return value === undefined
    ? null
    : value;
}

function asBoolean(
  value: unknown,
  fallback: boolean
) {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function clampStep(
  value: unknown
) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value)
  ) {
    return 1;
  }

  return Math.min(
    8,
    Math.max(
      1,
      value
    )
  );
}

function parseHydratedProject(
  project: ProjectRow
): HydratedProject {
  const state =
    isRecord(project.state)
      ? project.state
      : {};

  return {
    step:
      clampStep(
        project.current_step
      ),
    title:
      asString(
        project.research_title
      ),
    abstract:
      asString(
        project.research_abstract
      ),
    keywords:
      asString(
        project.research_keywords
      ),
    publisher:
      asString(
        project.publisher
      ),
    journal:
      asString(
        project.journal
      ),
    artworkType:
      asString(
        project.artwork_type
      ),
    state: {
      assetNotes:
        asString(
          state.assetNotes
        ),
      visualStyle:
        asString(
          state.visualStyle
        ),
      visualEmphasis:
        asString(
          state.visualEmphasis
        ),
      visualMood:
        asString(
          state.visualMood
        ),
      visualNotes:
        asString(
          state.visualNotes
        ),
      conceptResult:
        asNullableValue(
          state.conceptResult
        ),
      selectedConcept:
        asNullableValue(
          state.selectedConcept
        ),
      artRealism:
        asString(
          state.artRealism
        ),
      artFreedom:
        asString(
          state.artFreedom
        ),
      artComposition:
        asString(
          state.artComposition
        ),
      artColorDirection:
        asString(
          state.artColorDirection
        ),
      preserveAssets:
        asBoolean(
          state.preserveAssets,
          true
        ),
      artNotes:
        asString(
          state.artNotes
        ),
      productionBrief:
        asNullableValue(
          state.productionBrief
        ),
    },
  };
}

function hasMeaningfulContent(
  snapshot: ProjectSnapshot
) {
  return (
    snapshot.currentStep > 1 ||
    Boolean(
      snapshot.researchTitle.trim() ||
        snapshot.researchAbstract.trim() ||
        snapshot.researchKeywords.trim() ||
        snapshot.publisher.trim() ||
        snapshot.journal.trim() ||
        snapshot.artworkType.trim()
    )
  );
}

async function readJson(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function responseError(
  data: unknown,
  fallback: string
) {
  if (
    isRecord(data) &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

export function useProjectPersistence({
  snapshot,
  onHydrate,
}: {
  snapshot: ProjectSnapshot;
  onHydrate:
    (project: HydratedProject) => void;
}) {
  const [
    projectId,
    setProjectId,
  ] =
    useState<string | null>(
      null
    );
  const [
    status,
    setStatus,
  ] =
    useState<PersistenceStatus>(
      "loading"
    );
  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const projectIdRef =
    useRef<string | null>(
      null
    );
  const readyRef =
    useRef(false);
  const inFlightRef =
    useRef(false);
  const pendingRef =
    useRef<PendingSave | null>(
      null
    );
  const lastSavedRef =
    useRef("");

  const flushPending =
    useCallback(
      async () => {
        if (
          inFlightRef.current ||
          !readyRef.current
        ) {
          return projectIdRef.current;
        }

        inFlightRef.current =
          true;

        try {
          while (
            pendingRef.current &&
            pendingRef.current
              .serialized !==
              lastSavedRef.current
          ) {
            const current =
              pendingRef.current;

            if (
              !projectIdRef.current &&
              !hasMeaningfulContent(
                current.snapshot
              )
            ) {
              setStatus(
                "idle"
              );

              break;
            }

            setStatus(
              "saving"
            );
            setError(
              null
            );

            const existingId =
              projectIdRef.current;
            const response =
              await fetch(
                existingId
                  ? `/api/projects/${existingId}`
                  : "/api/projects",
                {
                  method:
                    existingId
                      ? "PATCH"
                      : "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body:
                    JSON.stringify({
                      name:
                        current.snapshot
                          .researchTitle ||
                        "Untitled project",
                      ...current.snapshot,
                    }),
                }
              );

            const data =
              await readJson(
                response
              );

            if (!response.ok) {
              throw new Error(
                responseError(
                  data,
                  `Project save failed with HTTP ${response.status}.`
                )
              );
            }

            if (
              !existingId &&
              isRecord(data) &&
              isRecord(
                data.project
              ) &&
              typeof data.project.id ===
                "string"
            ) {
              const createdId =
                data.project.id;

              projectIdRef.current =
                createdId;
              setProjectId(
                createdId
              );

              const url =
                new URL(
                  window.location.href
                );
              url.searchParams.set(
                "project",
                createdId
              );
              window.history.replaceState(
                null,
                "",
                url
              );
            }

            lastSavedRef.current =
              current.serialized;
            setStatus(
              "saved"
            );
          }
        } catch (
          saveError
        ) {
          console.error(
            "Project autosave error:",
            saveError
          );

          setStatus(
            "error"
          );
          setError(
            saveError instanceof Error
              ? saveError.message
              : "Could not save project."
          );
        } finally {
          inFlightRef.current =
            false;
        }

        return projectIdRef.current;
      },
      []
    );

  useEffect(
    () => {
      let cancelled =
        false;

      async function load() {
        const params =
          new URLSearchParams(
            window.location.search
          );
        const requestedId =
          params.get(
            "project"
          );

        if (!requestedId) {
          readyRef.current =
            true;
          setStatus(
            "idle"
          );

          return;
        }

        projectIdRef.current =
          requestedId;
        setProjectId(
          requestedId
        );
        setStatus(
          "loading"
        );

        try {
          const response =
            await fetch(
              `/api/projects/${encodeURIComponent(
                requestedId
              )}`,
              {
                method:
                  "GET",
                cache:
                  "no-store",
              }
            );
          const data =
            await readJson(
              response
            );

          if (!response.ok) {
            throw new Error(
              responseError(
                data,
                `Project load failed with HTTP ${response.status}.`
              )
            );
          }

          if (
            !isRecord(data) ||
            !isRecord(
              data.project
            )
          ) {
            throw new Error(
              "The saved project response was invalid."
            );
          }

          if (cancelled) {
            return;
          }

          onHydrate(
            parseHydratedProject(
              data.project
            )
          );
          setStatus(
            "saved"
          );
        } catch (
          loadError
        ) {
          if (cancelled) {
            return;
          }

          console.error(
            "Project load error:",
            loadError
          );

          setStatus(
            "error"
          );
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load project."
          );
        } finally {
          if (!cancelled) {
            readyRef.current =
              true;
          }
        }
      }

      void load();

      return () => {
        cancelled =
          true;
      };
    },
    [
      onHydrate,
    ]
  );

  useEffect(
    () => {
      const serialized =
        JSON.stringify(
          snapshot
        );

      pendingRef.current = {
        serialized,
        snapshot,
      };

      if (
        !readyRef.current ||
        serialized ===
          lastSavedRef.current
      ) {
        return;
      }

      const timer =
        window.setTimeout(
          () => {
            void flushPending();
          },
          800
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      snapshot,
      flushPending,
    ]
  );

  return {
    projectId,
    status,
    error,
    saveNow:
      flushPending,
  };
}
