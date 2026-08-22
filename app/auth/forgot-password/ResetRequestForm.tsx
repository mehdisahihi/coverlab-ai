"use client";

import {
  useState,
} from "react";
import {
  Turnstile,
} from "@marsidev/react-turnstile";

import {
  requestPasswordReset,
} from "../actions";

export default function ResetRequestForm() {
  const [captchaToken, setCaptchaToken] =
    useState("");

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const captchaReady =
    Boolean(siteKey && captchaToken);

  return (
    <form className="mt-7 space-y-4">
      <input
        type="hidden"
        name="captchaToken"
        value={captchaToken}
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

      <div className="pt-1">
        {siteKey ? (
          <Turnstile
            siteKey={siteKey}
            onSuccess={(token) => {
              setCaptchaToken(token);
            }}
            onExpire={() => {
              setCaptchaToken("");
            }}
            onError={() => {
              setCaptchaToken("");
            }}
            options={{
              theme: "dark",
            }}
          />
        ) : (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
            Turnstile is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to the environment and restart the app.
          </div>
        )}
      </div>

      <button
        formAction={requestPasswordReset}
        disabled={!captchaReady}
        className="w-full rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send reset link
      </button>
    </form>
  );
}
