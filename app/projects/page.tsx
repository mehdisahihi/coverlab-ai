import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import {
  signOut,
} from "@/app/auth/actions";
import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";

export default async function ProjectsPage() {
  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    redirect(
      "/auth/login?next=/projects"
    );
  }

  const {
    data: projects,
    error,
  } =
    await supabase
      .from(
        "projects"
      )
      .select(
        "id,name,research_title,publisher,journal,artwork_type,current_step,updated_at"
      )
      .order(
        "updated_at",
        {
          ascending:
            false,
        }
      );

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
          >
            CoverLab
            <span className="text-cyan-400">
              AI
            </span>
          </Link>

          <form action={signOut}>
            <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
              Research workspace
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Your projects
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              Publication targets, artwork versions and policy acknowledgements stay attached to your account.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-slate-200"
          >
            New project
          </Link>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-6">
            <p className="font-medium text-rose-200">
              Project storage is not ready yet.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Apply the CoverLab Supabase migration, then reload this page.
            </p>
          </div>
        ) : projects &&
          projects.length > 0 ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map(
              (project) => (
                <Link
                  key={project.id}
                  href={`/create?project=${project.id}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-400/30 hover:bg-white/[0.045]"
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
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-lg font-medium text-slate-200">
              No saved projects yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Start with a research title and publication target.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
