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

function isProtectedPath(
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

  if (
    isProtectedPath(
      request.nextUrl.pathname
    ) &&
    (error || !userId)
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
