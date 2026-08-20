"use client";

import {
  useEffect,
  useState,
} from "react";

export type AiOperation =
  | "generative-creation"
  | "generative-refinement"
  | "detail-enhancement";

export type ClientPolicyStatus =
  | "allowed"
  | "conditional"
  | "not-allowed"
  | "manual-check";

export type ClientPolicySource = {
  id: string;
  kind: string;
  title: string;
  url: string;
  accessedOn: string;
};

export type ClientPolicyDecision = {
  allowed: boolean;

  status:
    ClientPolicyStatus;

  disclosureRequired:
    boolean;

  disclosure:
    | {
        required:
          boolean | null;

        instructions?:
          string;

        suggestedText?:
          string;
      }
    | null;

  message:
    string;

  conditions:
    string[];

  provenance:
    | {
        sourceIds:
          string[];

        verifiedOn:
          string;

        verificationStatus:
          string;

        confidence:
          string;
      }
    | null;

  sources:
    ClientPolicySource[];
};

type UsePublicationAiPolicyArgs = {
  publisher:
    string;

  journal:
    string;

  artworkType:
    string;

  aiUseType:
    AiOperation;
};

export function usePublicationAiPolicy({
  publisher,
  journal,
  artworkType,
  aiUseType,
}: UsePublicationAiPolicyArgs) {
  const [
    policy,
    setPolicy,
  ] =
    useState<ClientPolicyDecision | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    let cancelled =
      false;

    const controller =
      new AbortController();

    async function loadPolicy() {
      if (
        !publisher.trim() ||
        !artworkType.trim()
      ) {
        setPolicy(
          null
        );

        setError(
          ""
        );

        setLoading(
          false
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        const params =
          new URLSearchParams({
            publisher,
            journal,
            artworkType,
            aiUseType,
          });

        const response =
          await fetch(
            `/api/publications/policy?${params.toString()}`,
            {
              cache:
                "no-store",

              signal:
                controller.signal,
            }
          );

        const text =
          await response.text();

        const data =
          text
            ? JSON.parse(
                text
              )
            : null;

        if (
          !response.ok
        ) {
          throw new Error(
            data?.error ||
              "Could not resolve AI policy."
          );
        }

        if (
          !cancelled
        ) {
          setPolicy(
            data
          );
        }
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name ===
            "AbortError"
        ) {
          return;
        }

        if (
          !cancelled
        ) {
          setPolicy(
            null
          );

          setError(
            err instanceof Error
              ? err.message
              : "Could not resolve AI policy."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    loadPolicy();

    return () => {
      cancelled =
        true;

      controller.abort();
    };
  }, [
    publisher,
    journal,
    artworkType,
    aiUseType,
  ]);

  return {
    policy,
    loading,
    error,

    blocked:
      Boolean(
        policy &&
          !policy.allowed
      ),
  };
}
