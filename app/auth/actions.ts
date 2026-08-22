"use server";

import {
  revalidatePath,
} from "next/cache";
import {
  cookies,
} from "next/headers";
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

function forgotPasswordUrl({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  const params =
    new URLSearchParams();

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

  const query =
    params.toString();

  return query
    ? `/auth/forgot-password?${query}`
    : "/auth/forgot-password";
}

function updatePasswordUrl({
  error,
}: {
  error: string;
}) {
  const params =
    new URLSearchParams({
      error,
    });

  return `/auth/update-password?${params.toString()}`;
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

export async function requestPasswordReset(
  formData: FormData
) {
  const email =
    formData.get(
      "email"
    );

  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    redirect(
      forgotPasswordUrl({
        error:
          "Email is required.",
      })
    );
  }

  const captchaToken =
    readCaptchaToken(
      formData
    );

  if (!captchaToken) {
    redirect(
      forgotPasswordUrl({
        error:
          "Complete the bot-protection check and try again.",
      })
    );
  }

  const supabase =
    await createClient();

  const {
    error,
  } =
    await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        captchaToken,
      }
    );

  if (error) {
    redirect(
      forgotPasswordUrl({
        error:
          "We couldn't send a reset email. Please try again in a moment.",
      })
    );
  }

  redirect(
    forgotPasswordUrl({
      message:
        "If an account exists for that email, a password reset link has been sent.",
    })
  );
}

export async function updatePassword(
  formData: FormData
) {
  const password =
    formData.get(
      "password"
    );
  const confirmation =
    formData.get(
      "passwordConfirmation"
    );

  if (
    typeof password !== "string" ||
    typeof confirmation !== "string" ||
    !password ||
    !confirmation
  ) {
    redirect(
      updatePasswordUrl({
        error:
          "Enter and confirm your new password.",
      })
    );
  }

  if (password !== confirmation) {
    redirect(
      updatePasswordUrl({
        error:
          "The passwords do not match.",
      })
    );
  }

  if (password.length < 10) {
    redirect(
      updatePasswordUrl({
        error:
          "Use a password with at least 10 characters.",
      })
    );
  }

  const cookieStore =
    await cookies();

  if (
    cookieStore.get(
      "coverlab_recovery"
    )?.value !== "1"
  ) {
    redirect(
      forgotPasswordUrl({
        error:
          "Start a new password reset request. The recovery session is missing or has expired.",
      })
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
    cookieStore.delete(
      "coverlab_recovery"
    );

    redirect(
      forgotPasswordUrl({
        error:
          "Start a new password reset request. The recovery session is missing or has expired.",
      })
    );
  }

  const {
    error,
  } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    redirect(
      updatePasswordUrl({
        error:
          error.message,
      })
    );
  }

  cookieStore.delete(
    "coverlab_recovery"
  );

  await supabase.auth.signOut({
    scope: "global",
  });

  revalidatePath(
    "/",
    "layout"
  );

  redirect(
    loginUrl({
      message:
        "Password updated. Sign in with your new password.",
      next:
        "/projects",
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
