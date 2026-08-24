export async function POST() {
  return Response.json(
    {
      error:
        "This legacy enhancement endpoint is disabled. Use the background enhancement workflow instead.",
      code:
        "LEGACY_ENHANCEMENT_ENDPOINT_DISABLED",
    },
    {
      status: 410,
      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",
        Pragma:
          "no-cache",
        "X-Content-Type-Options":
          "nosniff",
      },
    }
  );
}
