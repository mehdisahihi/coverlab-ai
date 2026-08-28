import {
  createServerClient,
} from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  getSupabasePublicConfig,
} from "./config";

function isProtectedBrowserPath(
  pathname: string
) {
  return (
    pathname === "/create" ||
    pathname.startsWith(
      "/create/"
    ) ||
    pathname === "/projects" ||
    pathname.startsWith(
      "/projects/"
    ) ||
    pathname === "/assisted" ||
    pathname.startsWith(
      "/assisted/"
    ) ||
    pathname === "/admin" ||
    pathname.startsWith(
      "/admin/"
    )
  );
}

function isProtectedApiPath(
  pathname: string
) {
  return (
    pathname === "/api" ||
    pathname.startsWith(
      "/api/"
    )
  );
}

function copySessionCookies(
  source: NextResponse,
  target: NextResponse
) {
  source.cookies
    .getAll()
    .forEach(
      (cookie) => {
        target.cookies.set(
          cookie
        );
      }
    );

  return target;
}

function jsonResponse(
  sessionResponse: NextResponse,
  body: Record<string, unknown>,
  init: {
    status: number;
    headers?: Record<string, string>;
  }
) {
  return copySessionCookies(
    sessionResponse,
    NextResponse.json(
      body,
      init
    )
  );
}

export async function updateSession(
  request: NextRequest
) {
  let response =
    NextResponse.next({
      request,
    });

  const {
    url,
    publishableKey,
  } = getSupabasePublicConfig();

  const supabase =
    createServerClient(
      url,
      publishableKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) =>
                request.cookies.set(
                  name,
                  value
                )
            );

            response =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) =>
                response.cookies.set(
                  name,
                  value,
                  options
                )
            );
          },
        },
      }
    );

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims();

  const userId =
    typeof data?.claims?.sub ===
    "string"
      ? data.claims.sub
      : null;

  const pathname =
    request.nextUrl.pathname;
  const protectedApiPath =
    isProtectedApiPath(
      pathname
    );
  const protectedBrowserPath =
    isProtectedBrowserPath(
      pathname
    );
  const protectedPath =
    protectedApiPath ||
    protectedBrowserPath;
  const unauthenticated =
    Boolean(
      error ||
      !userId
    );

  if (
    protectedApiPath &&
    unauthenticated
  ) {
    return jsonResponse(
      response,
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
      }
    );
  }

  if (
    protectedBrowserPath &&
    unauthenticated
  ) {
    const redirectUrl =
      request.nextUrl.clone();

    redirectUrl.pathname =
      "/auth/login";

    redirectUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return copySessionCookies(
      response,
      NextResponse.redirect(
        redirectUrl
      )
    );
  }

  if (
    protectedPath &&
    !unauthenticated
  ) {
    const {
      data: hasPersonalAccess,
      error: personalAccessError,
    } =
      await supabase.rpc(
        "is_coverlab_assisted_admin"
      );

    if (personalAccessError) {
      console.error(
        "Personal workspace access check failed:",
        {
          code:
            personalAccessError.code,
          message:
            personalAccessError.message,
        }
      );

      if (protectedApiPath) {
        return jsonResponse(
          response,
          {
            error:
              "Private workspace access could not be verified.",
            code:
              "PERSONAL_ACCESS_CHECK_UNAVAILABLE",
          },
          {
            status: 503,
          }
        );
      }

      return copySessionCookies(
        response,
        new NextResponse(
          "Private workspace access could not be verified.",
          {
            status: 503,
            headers: {
              "Content-Type":
                "text/plain; charset=utf-8",
            },
          }
        )
      );
    }

    if (
      hasPersonalAccess !==
      true
    ) {
      await supabase.auth.signOut();

      if (protectedApiPath) {
        return jsonResponse(
          response,
          {
            error:
              "This CoverLab workspace is private.",
            code:
              "PERSONAL_ACCESS_REQUIRED",
          },
          {
            status: 403,
          }
        );
      }

      const redirectUrl =
        request.nextUrl.clone();

      redirectUrl.pathname =
        "/auth/login";
      redirectUrl.search =
        "";
      redirectUrl.searchParams.set(
        "error",
        "This CoverLab workspace is private."
      );

      return copySessionCookies(
        response,
        NextResponse.redirect(
          redirectUrl
        )
      );
    }
  }

  /*
   * The active publication-quality UI uses the
   * background /start + /status flow. Keep the old
   * synchronous endpoint in the repository for now,
   * but do not allow it to bypass the current
   * publication AI-policy enforcement path.
   */
  if (
    request.method === "POST" &&
    pathname ===
      "/api/enhance-publication-artwork"
  ) {
    return jsonResponse(
      response,
      {
        error:
          "This legacy enhancement endpoint is disabled. Use the publication enhancement start endpoint.",
        code:
          "LEGACY_ENHANCEMENT_ENDPOINT_DISABLED",
      },
      {
        status: 410,
      }
    );
  }

  return response;
}
