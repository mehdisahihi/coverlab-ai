import ResetRequestForm from "./ResetRequestForm";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params =
    await searchParams;

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
            Account recovery
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Reset your password
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Enter your account email. If an account exists, CoverLab will send a secure reset link.
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

          <ResetRequestForm />

          <p className="mt-6 text-center text-sm text-slate-400">
            <a
              href="/auth/login"
              className="text-cyan-300 transition hover:text-cyan-200"
            >
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
