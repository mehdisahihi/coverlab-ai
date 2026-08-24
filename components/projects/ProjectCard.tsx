"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

type ProjectSummary = {
  id: string;
  name: string;
  research_title: string | null;
  publisher: string | null;
  journal: string | null;
  artwork_type: string | null;
  current_step: number;
};

type Props = {
  project: ProjectSummary;
};

export default function ProjectCard({
  project,
}: Props) {
  const router =
    useRouter();

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);
  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  async function deleteProject() {
    if (deleting) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete “${project.name}” permanently?\n\nThis removes the saved workflow, scientific source assets, artwork versions and stored policy acknowledgement history for this project. This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            project.id
          )}`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        let message =
          `Could not delete project. HTTP ${response.status}.`;

        try {
          const data =
            await response.json();

          if (
            data &&
            typeof data.error ===
              "string"
          ) {
            message =
              data.error;
          }
        } catch {
          /* keep fallback */
        }

        throw new Error(
          message
        );
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete project."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-cyan-400/20 hover:bg-white/[0.04]">
      <Link
        href={`/create?project=${project.id}`}
        className="block p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-medium text-white">
              {project.name}
            </p>

            {project.research_title && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                {project.research_title}
              </p>
            )}
          </div>

          <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">
            Step {project.current_step}
          </span>
        </div>

        <div className="mt-5 space-y-1 text-xs text-slate-500">
          {(project.journal ||
            project.publisher) && (
            <p>
              {[project.journal, project.publisher]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {project.artwork_type && (
            <p>
              {project.artwork_type ===
              "Front Cover"
                ? "Journal Cover"
                : project.artwork_type}
            </p>
          )}
        </div>

        <p className="mt-5 text-xs font-medium text-cyan-300">
          Resume project →
        </p>
      </Link>

      <div className="border-t border-white/10 px-6 py-4">
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            void deleteProject();
          }}
          className="text-sm text-rose-300 transition hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting
            ? "Deleting project…"
            : "Delete project"}
        </button>

        {error && (
          <p className="mt-3 text-xs leading-5 text-rose-200">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
