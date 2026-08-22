import type {
  EmailOtpType,
} from "@supabase/supabase-js";
import {
  type NextRequest,
  NextResponse,
} from "next/server";

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

function appOrigin(
  request: NextRequest
) {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return new URL(
      configuredSiteUrl
    ).origin;
  }

  const codespaceName =
    process.env.CODESPACE_NAME;
  const forwardingDomain =
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;

  if (
    codespaceName &&
    forwardingDomain
  ) {
    return `https://${codespaceName}-3000.${forwardingDomain}`;
  }

  return request.nextUrl.origin;
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
    appOrigin(request);

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
