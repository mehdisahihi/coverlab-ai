import {
  cookies,
} from "next/headers";
import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  updatePassword,
} from "../actions";

type UpdatePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  const params =
    await searchParams;

  const cookieStore =
    await cookies();

  if (
    cookieStore.get(
      "coverlab_recovery"
    )?.value !== "1"
  ) {
    redirect(
      "/auth/forgot-password?error=Start+a+new+password+reset+request.+The+recovery+session+is+missing+or+has+expired."
    );
  }

  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    redirect(
      "/auth/forgot-password?error=Start+a+new+password+reset+request.+The+recovery+session+is+missing+or+has+expired."
    );
  }

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
            Choose a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Use at least 10 characters with lowercase and uppercase letters, a number and a symbol.
          </p>

          {params.error && (
            <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
              {params.error}
            </div>
          )}

          <form
            action={updatePassword}
            className="mt-7 space-y-4"
          >
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                New password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-[#0d121c] px-4 py-3.5 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                placeholder="New password"
              />
            </div>

            <div>
              <label
                htmlFor="passwordConfirmation"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Confirm new password
              </label>

              <input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-[#0d121c] px-4 py-3.5 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                placeholder="Repeat new password"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-slate-200"
            >
              Update password
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
