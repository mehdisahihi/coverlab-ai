import {
  type NextRequest,
} from "next/server";

import {
  updateSession,
} from "@/lib/supabase/proxy";

export async function proxy(
  request: NextRequest
) {
  return updateSession(
    request
  );
}

export const config = {
  matcher: [
    "/create/:path*",
    "/projects/:path*",
    "/api/projects/:path*",
    "/api/concepts",
    "/api/production-brief",
    "/api/generate-artwork",
    "/api/refine-artwork",
    "/api/enhance-publication-artwork/:path*",
  ],
};
