import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";

type ThanksPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function AssistedThanksPage({
  searchParams,
}: ThanksPageProps) {
  const params =
    await searchParams;

  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    redirect(
      "/auth/login?next=/assisted"
    );
  }

  if (!params.id) {
    redirect(
      "/assisted"
    );
  }

  const {
    data: request,
    error,
  } =
    await supabase
      .from(
        "assisted_production_requests"
      )
      .select(
        "id,service_type,paper_title,status,created_at"
      )
      .eq(
        "id",
        params.id
      )
      .maybeSingle();

  if (
    error ||
    !request
  ) {
    redirect(
      "/assisted?error=We+could+not+find+that+request."
    );
  }

  const serviceLabel =
    request.service_type ===
    "journal_cover"
      ? "Journal Cover"
      : "Graphical Abstract";

  const startingPrice =
    request.service_type ===
    "journal_cover"
      ? "€399"
      : "€249";

  const reference =
    String(request.id)
      .slice(0, 8)
      .toUpperCase();

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight"
        >
          CoverLab
          <span className="text-cyan-400">
            AI
          </span>
        </Link>

        <div className="mt-12 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.05] p-8 md:p-10">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
            Request received
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            Your assisted production request is saved.
          </h1>

          <p className="mt-5 leading-7 text-slate-400">
            We will review the scientific and production scope before any payment is requested. The starting price shown for this service is not a final quote.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Service
              </div>
              <div className="mt-2 font-medium text-slate-100">
                {serviceLabel}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Assisted production from {startingPrice}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Request reference
              </div>
              <div className="mt-2 font-mono text-lg text-slate-100">
                {reference}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Status: received
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Project
            </div>
            <div className="mt-2 text-slate-200">
              {request.paper_title}
            </div>
          </div>

          <p className="mt-7 text-sm leading-6 text-slate-500">
            If the scope requires manuscript files, figures or other scientific assets, we will request them separately after the initial review.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-slate-200"
            >
              Back to projects
            </Link>

            <Link
              href="/assisted"
              className="rounded-full border border-white/10 px-6 py-3 font-medium text-slate-200 transition hover:bg-white/[0.05]"
            >
              Submit another request
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
