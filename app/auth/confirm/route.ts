import type {
  EmailOtpType,
} from "@supabase/supabase-js";
import {
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  resolveTrustedAppOrigin,
} from "@/lib/deployment/siteUrl";
import {
  createClient,
} from "@/lib/supabase/server";

function safeNext(
  value: string | null
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

export async function GET(
  request: NextRequest
) {
  const tokenHash =
    request.nextUrl.searchParams.get(
      "token_hash"
    );

  const type =
    request.nextUrl.searchParams.get(
      "type"
    ) as EmailOtpType | null;

  const next = safeNext(
    request.nextUrl.searchParams.get(
      "next"
    )
  );

  const origin =
    resolveTrustedAppOrigin(
      request
    );

  if (!origin) {
    return new NextResponse(
      "Application URL configuration is unavailable.",
      {
        status: 503,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      }
    );
  }

  if (tokenHash && type) {
    const supabase =
      await createClient();

    const {
      error,
    } =
      await supabase.auth.verifyOtp({
        type,
        token_hash:
          tokenHash,
      });

    if (!error) {
      const response =
        NextResponse.redirect(
          new URL(
            next,
            origin
          )
        );

      if (type === "recovery") {
        response.cookies.set(
          "coverlab_recovery",
          "1",
          {
            httpOnly: true,
            secure:
              origin.startsWith(
                "https://"
              ),
            sameSite: "lax",
            path:
              "/auth/update-password",
            maxAge:
              15 * 60,
          }
        );
      }

      return response;
    }
  }

  const redirectUrl =
    new URL(
      "/auth/login",
      origin
    );

  redirectUrl.searchParams.set(
    "error",
    "The confirmation link is invalid or has expired."
  );

  redirectUrl.searchParams.set(
    "next",
    next
  );

  return NextResponse.redirect(
    redirectUrl
  );
}
