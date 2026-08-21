import {
  createClient,
} from "@/lib/supabase/server";

export async function getAuthenticatedContext() {
  const supabase =
    await createClient();

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

  return {
    supabase,
    userId,
    authError:
      error ?? null,
  };
}
