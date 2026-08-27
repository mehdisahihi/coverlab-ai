import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  signOut,
} from "@/app/auth/actions";
import {
  updateAssistedRequestStatus,
} from "@/app/admin/assisted/actions";
import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  ASSISTED_REQUEST_STATUSES,
  ASSISTED_REQUEST_STATUS_LABELS,
  isAssistedRequestStatus,
  type AssistedRequestStatus,
} from "@/lib/assisted/status";

type AssistedRequest = {
  id: string;
  user_id: string;
  project_id: string | null;
  service_type:
    | "graphical_abstract"
    | "journal_cover";
  contact_name: string;
  contact_email: string;
  institution: string;
  paper_title: string;
  target_journal: string;
  research_summary: string;
  deadline: string | null;
  notes: string;
  status: AssistedRequestStatus;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  searchParams: Promise<{
    status?: string | string[];
    error?: string | string[];
    updated?: string | string[];
  }>;
};

const STATUS_BADGE_CLASSES: Record<
  AssistedRequestStatus,
  string
> = {
  requested:
    "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200",
  reviewing:
    "border-blue-400/20 bg-blue-400/[0.08] text-blue-200",
  quoted:
    "border-violet-400/20 bg-violet-400/[0.08] text-violet-200",
  accepted:
    "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
  in_production:
    "border-amber-400/20 bg-amber-400/[0.08] text-amber-200",
  declined:
    "border-rose-400/20 bg-rose-400/[0.08] text-rose-200",
  completed:
    "border-green-400/20 bg-green-400/[0.08] text-green-200",
  cancelled:
    "border-slate-400/20 bg-slate-400/[0.08] text-slate-300",
};

function serviceLabel(
  serviceType: AssistedRequest["service_type"]
) {
  return serviceType ===
    "journal_cover"
    ? "Journal Cover"
    : "Graphical Abstract";
}

function displayValue(
  value: string | null
) {
  return value?.trim() ||
    "Not provided";
}

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
      timeZone:
        "Europe/Paris",
    }
  ).format(date);
}

function queryValue(
  value:
    | string
    | string[]
    | undefined
) {
  return typeof value ===
    "string"
    ? value
    : "";
}

export default async function AssistedAdminPage({
  searchParams,
}: PageProps) {
  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    redirect(
      "/auth/login?next=%2Fadmin%2Fassisted"
    );
  }

  const {
    data: isAdmin,
    error: adminError,
  } =
    await supabase.rpc(
      "is_coverlab_assisted_admin"
    );

  if (
    adminError ||
    isAdmin !== true
  ) {
    if (adminError) {
      console.error(
        "Assisted admin access check failed:",
        {
          code:
            adminError.code,
          message:
            adminError.message,
        }
      );
    }

    notFound();
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_list_assisted_production_requests"
    );

  const params =
    await searchParams;
  const requestedFilter =
    queryValue(
      params.status
    );
  const activeFilter =
    isAssistedRequestStatus(
      requestedFilter
    )
      ? requestedFilter
      : "all";
  const updateError =
    queryValue(
      params.error
    );
  const updatedId =
    queryValue(
      params.updated
    );

  const requests =
    (data ?? []) as AssistedRequest[];
  const filteredRequests =
    activeFilter ===
    "all"
      ? requests
      : requests.filter(
          (request) =>
            request.status ===
            activeFilter
        );

  const statusCounts =
    ASSISTED_REQUEST_STATUSES.reduce(
      (counts, status) => {
        counts[status] =
          requests.filter(
            (request) =>
              request.status ===
              status
          ).length;

        return counts;
      },
      {} as Record<
        AssistedRequestStatus,
        number
      >
    );

  const openCount =
    requests.filter(
      (request) =>
        ![
          "completed",
          "declined",
          "cancelled",
        ].includes(
          request.status
        )
    ).length;

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight"
            >
              CoverLab
              <span className="text-cyan-400">
                AI
              </span>
            </Link>

            <span className="hidden rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-violet-200 sm:inline-flex">
              Internal admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Projects
            </Link>

            <form action={signOut}>
              <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
              Assisted production
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Request dashboard
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-slate-400">
              Review incoming scientific art requests, inspect project context and move each request through the production workflow.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="text-2xl font-semibold">
                {requests.length}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                Total
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] px-5 py-4">
              <p className="text-2xl font-semibold text-cyan-200">
                {statusCounts.requested}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                New
              </p>
            </div>

            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.04] px-5 py-4">
              <p className="text-2xl font-semibold text-violet-200">
                {openCount}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                Open
              </p>
            </div>
          </div>
        </div>

        {updateError ? (
          <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-5 py-4 text-sm text-rose-100">
            The status update could not be completed. Reload the page and try again.
          </div>
        ) : updatedId ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4 text-sm text-emerald-100">
            Request status updated successfully.
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/admin/assisted"
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeFilter ===
              "all"
                ? "border-white/20 bg-white text-black"
                : "border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            All ({requests.length})
          </Link>

          {ASSISTED_REQUEST_STATUSES.map(
            (status) => (
              <Link
                key={status}
                href={`/admin/assisted?status=${status}`}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  activeFilter ===
                  status
                    ? "border-white/20 bg-white text-black"
                    : "border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {ASSISTED_REQUEST_STATUS_LABELS[status]} ({statusCounts[status]})
              </Link>
            )
          )}
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-6">
            <p className="font-medium text-rose-200">
              Assisted requests could not be loaded.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The admin RPC returned an error. Check the Preview runtime logs before retrying.
            </p>
          </div>
        ) : filteredRequests.length ===
          0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-lg font-medium text-slate-200">
              No requests in this view
            </p>
            <p className="mt-2 text-sm text-slate-500">
              New assisted-production requests will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {filteredRequests.map(
              (request) => (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"
                >
                  <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-7">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                          {serviceLabel(
                            request.service_type
                          )}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[request.status]}`}
                        >
                          {ASSISTED_REQUEST_STATUS_LABELS[request.status]}
                        </span>
                        <span className="text-xs text-slate-500">
                          Received {formatDateTime(request.created_at)} Paris time
                        </span>
                      </div>

                      <h2 className="mt-4 break-words text-2xl font-semibold tracking-tight text-slate-100">
                        {request.paper_title}
                      </h2>

                      <div className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-600">
                            Contact
                          </p>
                          <p className="mt-1 text-slate-300">
                            {request.contact_name}
                          </p>
                          <a
                            href={`mailto:${request.contact_email}`}
                            className="mt-1 block break-all text-cyan-300 hover:text-cyan-200"
                          >
                            {request.contact_email}
                          </a>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-600">
                            Institution
                          </p>
                          <p className="mt-1 text-slate-300">
                            {displayValue(
                              request.institution
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-600">
                            Target journal
                          </p>
                          <p className="mt-1 text-slate-300">
                            {displayValue(
                              request.target_journal
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-600">
                            Deadline
                          </p>
                          <p className="mt-1 text-slate-300">
                            {displayValue(
                              request.deadline
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-600">
                            CoverLab project
                          </p>
                          <p className="mt-1 break-all font-mono text-xs text-slate-400">
                            {displayValue(
                              request.project_id
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-600">
                            Request ID
                          </p>
                          <p className="mt-1 break-all font-mono text-xs text-slate-400">
                            {request.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <p className="text-sm font-medium text-slate-200">
                        Workflow status
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Update only after the corresponding operational step is complete.
                      </p>

                      <form
                        action={updateAssistedRequestStatus}
                        className="mt-4 space-y-3"
                      >
                        <input
                          type="hidden"
                          name="requestId"
                          value={request.id}
                        />
                        <select
                          name="status"
                          defaultValue={request.status}
                          className="w-full rounded-xl border border-white/10 bg-[#0B111D] px-3 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-400/40"
                        >
                          {ASSISTED_REQUEST_STATUSES.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {ASSISTED_REQUEST_STATUS_LABELS[status]}
                              </option>
                            )
                          )}
                        </select>
                        <button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-slate-200">
                          Update status
                        </button>
                      </form>
                    </div>
                  </div>

                  <details className="group border-t border-white/10">
                    <summary className="cursor-pointer list-none px-6 py-4 text-sm font-medium text-slate-300 transition hover:bg-white/[0.025] lg:px-7">
                      <span className="flex items-center justify-between gap-4">
                        Scientific brief and notes
                        <span className="text-slate-600 transition group-open:rotate-180">
                          ↓
                        </span>
                      </span>
                    </summary>

                    <div className="grid gap-6 border-t border-white/10 bg-black/10 px-6 py-6 lg:grid-cols-2 lg:px-7">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">
                          Research summary
                        </p>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                          {request.research_summary}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-300">
                          Additional notes
                        </p>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                          {displayValue(
                            request.notes
                          )}
                        </p>

                        <p className="mt-6 text-xs text-slate-600">
                          Last updated {formatDateTime(request.updated_at)} Paris time
                        </p>
                      </div>
                    </div>
                  </details>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}
