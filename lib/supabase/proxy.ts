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
    )
  );
}

function isProtectedApiPath(
  pathname: string
) {
  return (
    pathname === "/api/projects" ||
    pathname.startsWith(
      "/api/projects/"
    ) ||
    pathname === "/api/concepts" ||
    pathname ===
      "/api/production-brief" ||
    pathname ===
      "/api/generate-artwork" ||
    pathname ===
      "/api/refine-artwork" ||
    pathname ===
      "/api/enhance-publication-artwork" ||
    pathname.startsWith(
      "/api/enhance-publication-artwork/"
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
  const unauthenticated =
    Boolean(
      error ||
      !userId
    );

  if (
    isProtectedApiPath(
      pathname
    ) &&
    unauthenticated
  ) {
    return NextResponse.json(
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
    isProtectedBrowserPath(
      pathname
    ) &&
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

    return NextResponse.redirect(
      redirectUrl
    );
  }

  return response;
}
