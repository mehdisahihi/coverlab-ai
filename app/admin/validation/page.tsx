import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  signOut,
} from "@/app/auth/actions";
import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";

type ValidationEvent = {
  id: string;
  user_id: string;
  user_email: string;
  project_id: string;
  research_title: string;
  service_type:
    | "graphical_abstract"
    | "journal_cover";
  offered_price_eur: number;
  currency: string;
  event_type:
    | "paywall_viewed"
    | "ready_to_pay";
  created_at: string;
};

function serviceLabel(
  serviceType:
    ValidationEvent["service_type"]
) {
  return serviceType ===
    "journal_cover"
    ? "Journal Cover"
    : "Graphical Abstract";
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

function percentage(
  numerator: number,
  denominator: number
) {
  if (
    denominator === 0
  ) {
    return "0%";
  }

  return `${(
    (numerator /
      denominator) *
    100
  ).toFixed(1)}%`;
}

export default async function PreRevenueValidationAdminPage() {
  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    redirect(
      "/auth/login?next=%2Fadmin%2Fvalidation"
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
        "Validation admin access check failed:",
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
      "admin_list_self_service_validation_events"
    );

  const events =
    (data ??
      []) as ValidationEvent[];
  const viewed =
    events.filter(
      (event) =>
        event.event_type ===
        "paywall_viewed"
    );
  const ready =
    events.filter(
      (event) =>
        event.event_type ===
        "ready_to_pay"
    );

  const readyValue =
    ready.reduce(
      (
        total,
        event
      ) =>
        total +
        event.offered_price_eur,
      0
    );

  const serviceMetrics =
    [
      "graphical_abstract",
      "journal_cover",
    ].map(
      (
        serviceType
      ) => {
        const serviceViewed =
          viewed.filter(
            (event) =>
              event.service_type ===
              serviceType
          );
        const serviceReady =
          ready.filter(
            (event) =>
              event.service_type ===
              serviceType
          );

        return {
          serviceType:
            serviceType as
              ValidationEvent["service_type"],
          viewed:
            serviceViewed.length,
          ready:
            serviceReady.length,
          conversion:
            percentage(
              serviceReady.length,
              serviceViewed.length
            ),
        };
      }
    );

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
              href="/admin/assisted"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Assisted requests
            </Link>

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
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
            Self-service validation
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Pre-revenue demand dashboard
          </h1>

          <p className="mt-4 leading-7 text-slate-400">
            Measure how many signed-in researchers reach the first AI step
            and how many explicitly say they would pay the displayed
            €99/€149 launch price. No payment is collected by this flow.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Paywall reached
            </p>
            <p className="mt-3 text-4xl font-semibold">
              {viewed.length}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/70">
              Ready to pay
            </p>
            <p className="mt-3 text-4xl font-semibold text-emerald-200">
              {ready.length}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-300/70">
              Intent conversion
            </p>
            <p className="mt-3 text-4xl font-semibold text-cyan-200">
              {percentage(
                ready.length,
                viewed.length
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-violet-300/70">
              Stated demand value
            </p>
            <p className="mt-3 text-4xl font-semibold text-violet-200">
              €{readyValue}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Interest only, not booked revenue.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {serviceMetrics.map(
            (metric) => (
              <div
                key={
                  metric.serviceType
                }
                className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"
              >
                <p className="font-medium text-slate-200">
                  {serviceLabel(
                    metric.serviceType
                  )}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-2xl font-semibold">
                      {
                        metric.viewed
                      }
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      reached
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-2xl font-semibold text-emerald-200">
                      {
                        metric.ready
                      }
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ready
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-2xl font-semibold text-cyan-200">
                      {
                        metric.conversion
                      }
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      conversion
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-6">
            <p className="font-medium text-rose-200">
              Validation events could not be loaded.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Check the Preview runtime logs and the admin validation RPC
              before retrying.
            </p>
          </div>
        ) : ready.length ===
          0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-lg font-medium text-slate-200">
              No ready-to-pay signals yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              When a researcher confirms early-access purchase intent, the
              project and account email will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                  High-intent leads
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Researchers ready to pay
                </h2>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">
                        Researcher
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Project
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Service
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Price
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Confirmed
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 bg-white/[0.02]">
                    {ready.map(
                      (event) => (
                        <tr
                          key={
                            event.id
                          }
                          className="align-top"
                        >
                          <td className="px-5 py-4">
                            {event.user_email ? (
                              <a
                                href={`mailto:${event.user_email}`}
                                className="break-all text-cyan-300 hover:text-cyan-200"
                              >
                                {
                                  event.user_email
                                }
                              </a>
                            ) : (
                              <span className="text-slate-500">
                                Email unavailable
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="max-w-sm text-slate-300">
                              {event.research_title ||
                                "Untitled project"}
                            </p>
                            <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
                              {
                                event.project_id
                              }
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {serviceLabel(
                              event.service_type
                            )}
                          </td>
                          <td className="px-5 py-4 font-medium text-white">
                            €
                            {
                              event.offered_price_eur
                            }
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                            {formatDateTime(
                              event.created_at
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-5 text-sm leading-6 text-slate-400">
          <span className="font-medium text-amber-200">
            Interpretation:
          </span>{" "}
          “Ready to pay” is a demand signal, not a sale, invoice or payment.
          Revenue remains zero until a compliant payment flow is deliberately
          enabled later.
        </div>
      </div>
    </main>
  );
}
