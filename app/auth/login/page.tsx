import {
  signIn,
  signUp,
} from "../actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

function safeNext(
  value: string | undefined
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/projects";
  }

  return value;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params =
    await searchParams;

  const next =
    safeNext(
      params.next
    );

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <a
          href="/"
          className="text-xl font-semibold tracking-tight"
        >
          CoverLab
          <span className="text-cyan-400">
            AI
          </span>
        </a>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
            Research workspace
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Sign in to CoverLab
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your account keeps publication projects, artwork versions and policy acknowledgements tied to you.
          </p>

          {params.error && (
            <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
              {params.error}
            </div>
          )}

          {params.message && (
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-200">
              {params.message}
            </div>
          )}

          <form className="mt-7 space-y-4">
            <input
              type="hidden"
              name="next"
              value={next}
            />

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-[#0d121c] px-4 py-3.5 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                placeholder="researcher@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-[#0d121c] px-4 py-3.5 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <button
                formAction={signIn}
                className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-slate-200"
              >
                Sign in
              </button>

              <button
                formAction={signUp}
                className="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/[0.06]"
              >
                Create account
              </button>
            </div>
          </form>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            New accounts may require email confirmation depending on the Supabase Auth project settings.
          </p>
        </div>
      </div>
    </main>
  );
}
