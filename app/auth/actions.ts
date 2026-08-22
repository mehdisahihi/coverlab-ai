"use server";

import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

function safeNext(
  value: FormDataEntryValue | null
) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/projects";
  }

  return value;
}

function loginUrl({
  error,
  message,
  next,
}: {
  error?: string;
  message?: string;
  next: string;
}) {
  const params =
    new URLSearchParams({
      next,
    });

  if (error) {
    params.set(
      "error",
      error
    );
  }

  if (message) {
    params.set(
      "message",
      message
    );
  }

  return `/auth/login?${params.toString()}`;
}

function readCredentials(
  formData: FormData
) {
  const email =
    formData.get(
      "email"
    );

  const password =
    formData.get(
      "password"
    );

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return null;
  }

  return {
    email:
      email.trim(),
    password,
  };
}

function readCaptchaToken(
  formData: FormData
) {
  const value =
    formData.get(
      "captchaToken"
    );

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  return value.trim();
}

export async function signIn(
  formData: FormData
) {
  const next = safeNext(
    formData.get(
      "next"
    )
  );

  const credentials =
    readCredentials(
      formData
    );

  if (!credentials) {
    redirect(
      loginUrl({
        error:
          "Email and password are required.",
        next,
      })
    );
  }

  const captchaToken =
    readCaptchaToken(
      formData
    );

  if (!captchaToken) {
    redirect(
      loginUrl({
        error:
          "Complete the bot-protection check and try again.",
        next,
      })
    );
  }

  const supabase =
    await createClient();

  const {
    error,
  } =
    await supabase.auth.signInWithPassword({
      ...credentials,
      options: {
        captchaToken,
      },
    });

  if (error) {
    redirect(
      loginUrl({
        error:
          error.message,
        next,
      })
    );
  }

  revalidatePath(
    "/",
    "layout"
  );

  redirect(
    next
  );
}

export async function signUp(
  formData: FormData
) {
  const next = safeNext(
    formData.get(
      "next"
    )
  );

  const credentials =
    readCredentials(
      formData
    );

  if (!credentials) {
    redirect(
      loginUrl({
        error:
          "Email and password are required.",
        next,
      })
    );
  }

  if (
    credentials.password.length <
    10
  ) {
    redirect(
      loginUrl({
        error:
          "Use a password with at least 10 characters.",
        next,
      })
    );
  }

  const captchaToken =
    readCaptchaToken(
      formData
    );

  if (!captchaToken) {
    redirect(
      loginUrl({
        error:
          "Complete the bot-protection check and try again.",
        next,
      })
    );
  }

  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase.auth.signUp({
      ...credentials,
      options: {
        captchaToken,
      },
    });

  if (error) {
    redirect(
      loginUrl({
        error:
          error.message,
        next,
      })
    );
  }

  revalidatePath(
    "/",
    "layout"
  );

  if (data.session) {
    redirect(
      next
    );
  }

  redirect(
    loginUrl({
      message:
        "Check your email to confirm your account, then sign in.",
      next,
    })
  );
}

export async function signOut() {
  const supabase =
    await createClient();

  await supabase.auth.signOut();

  revalidatePath(
    "/",
    "layout"
  );

  redirect(
    "/auth/login"
  );
}
