import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  submitAssistedRequest,
} from "./actions";

type AssistedPageProps = {
  searchParams: Promise<{
    error?: string;
    service?: string;
  }>;
};

type ServiceType =
  "graphical_abstract" |
  "journal_cover";

function selectedServiceType(
  value: string | undefined
): ServiceType {
  return value ===
    "journal_cover"
    ? "journal_cover"
    : "graphical_abstract";
}

export default async function AssistedPage({
  searchParams,
}: AssistedPageProps) {
  const params =
    await searchParams;

  const selectedService =
    selectedServiceType(
      params.service
    );

  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    const next =
      encodeURIComponent(
        `/assisted?service=${selectedService}`
      );

    redirect(
      `/auth/login?next=${next}`
    );
  }

  const {
    data: projects,
    error: projectsError,
  } =
    await supabase
      .from(
        "projects"
      )
      .select(
        "id,name,research_title,artwork_type"
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
          >
            CoverLab
            <span className="text-cyan-400">
              AI
            </span>
          </Link>

          <Link
            href="/#pricing"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Back to pricing
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.45fr_0.75fr]">
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
            CoverLab-assisted production
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Request a scientific artwork quote
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Tell us about the publication and the scientific story you want to communicate. We review the scope before any payment and send a project-specific quote.
          </p>

          {params.error && (
            <div className="mt-7 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-5 py-4 text-sm text-rose-200">
              {params.error}
            </div>
          )}

          <form
            action={submitAssistedRequest}
            className="mt-9 space-y-8 rounded-3xl border border-white/10 bg-white/[0.03] p-7 md:p-9"
          >
            <fieldset>
              <legend className="text-sm font-medium text-slate-200">
                What would you like us to produce?
              </legend>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="cursor-pointer rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan-400/30">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="serviceType"
                      value="graphical_abstract"
                      defaultChecked={
                        selectedService ===
                        "graphical_abstract"
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">
                        Graphical Abstract
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Assisted production from €249
                      </div>
                    </div>
                  </div>
                </label>

                <label className="cursor-pointer rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan-400/30">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="serviceType"
                      value="journal_cover"
                      defaultChecked={
                        selectedService ===
                        "journal_cover"
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">
                        Journal Cover
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Assisted production from €399
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="projectId"
                className="text-sm font-medium text-slate-200"
              >
                Existing CoverLab project
              </label>
              <select
                id="projectId"
                name="projectId"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
              >
                <option value="">
                  No project linked
                </option>
                {(projects ?? []).map(
                  (project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                      {project.research_title
                        ? ` — ${project.research_title}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Optional. Linking a saved project helps us understand the research context already prepared in CoverLab.
              </p>

              {projectsError && (
                <p className="mt-2 text-xs text-amber-200">
                  Your saved projects could not be loaded. You can still submit the request without linking one.
                </p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="contactName"
                  className="text-sm font-medium text-slate-200"
                >
                  Contact name
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label
                  htmlFor="contactEmail"
                  className="text-sm font-medium text-slate-200"
                >
                  Contact email
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  maxLength={320}
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="institution"
                className="text-sm font-medium text-slate-200"
              >
                Institution or research group
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                maxLength={200}
                autoComplete="organization"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label
                htmlFor="paperTitle"
                className="text-sm font-medium text-slate-200"
              >
                Paper or project title
              </label>
              <input
                id="paperTitle"
                name="paperTitle"
                type="text"
                required
                minLength={3}
                maxLength={500}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="targetJournal"
                  className="text-sm font-medium text-slate-200"
                >
                  Target journal or publisher
                </label>
                <input
                  id="targetJournal"
                  name="targetJournal"
                  type="text"
                  maxLength={200}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label
                  htmlFor="deadline"
                  className="text-sm font-medium text-slate-200"
                >
                  Preferred deadline
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="researchSummary"
                className="text-sm font-medium text-slate-200"
              >
                Research summary and visual goal
              </label>
              <textarea
                id="researchSummary"
                name="researchSummary"
                required
                minLength={20}
                maxLength={6000}
                rows={8}
                placeholder="Summarize the central scientific message, the visual story you want to communicate, and any elements that must be preserved."
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="text-sm font-medium text-slate-200"
              >
                Additional notes
              </label>
              <textarea
                id="notes"
                name="notes"
                maxLength={4000}
                rows={5}
                placeholder="Optional: journal specifications, scientific constraints, preferred style, or production considerations."
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111E] px-4 py-3 leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>

            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-5 text-sm leading-6 text-slate-300">
              No payment is required to request a quote. Please only provide research material that you are authorized to share. If additional manuscript files or scientific assets are needed, we will request them after reviewing the scope.
            </div>

            <button
              type="submit"
              className="inline-flex rounded-full bg-white px-7 py-3.5 font-medium text-black transition hover:bg-slate-200"
            >
              Request a quote →
            </button>
          </form>
        </section>

        <aside className="lg:pt-24">
          <div className="sticky top-8 rounded-3xl border border-violet-400/20 bg-violet-400/[0.06] p-7">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
              What happens next
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <div className="text-sm text-cyan-300">
                  01 · Scope review
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  We review the scientific context, publication target and production complexity.
                </p>
              </div>

              <div>
                <div className="text-sm text-cyan-300">
                  02 · Fixed quote
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  You receive the proposed scope and final price before any paid work begins.
                </p>
              </div>

              <div>
                <div className="text-sm text-cyan-300">
                  03 · Production
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  After approval, CoverLab handles the scientific-to-visual workflow with you through the agreed production scope.
                </p>
              </div>
            </div>

            <div className="mt-7 border-t border-white/10 pt-6 text-sm leading-6 text-slate-500">
              Starting prices: €249 for a graphical abstract and €399 for a journal cover. Final pricing depends on scientific and production complexity.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
