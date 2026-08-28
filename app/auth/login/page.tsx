import AuthForm from "./AuthForm";

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
            Private research workspace
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Sign in to CoverLab
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            This CoverLab deployment is for personal use only. Public account creation is disabled.
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

          <AuthForm next={next} />

          <p className="mt-6 text-xs leading-5 text-slate-500">
            Access is restricted to the authorized personal account. Bot protection is provided by Cloudflare Turnstile.
          </p>
        </div>
      </div>
    </main>
  );
}
