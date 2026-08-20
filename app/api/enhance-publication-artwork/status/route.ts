export async function GET(
  request: Request
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const responseId =
      url.searchParams.get(
        "id"
      );

    if (!responseId) {
      return Response.json(
        {
          error:
            "Response ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Retrieve the current state of the
      OpenAI background response.
    */

    const openaiResponse =
      await fetch(
        `https://api.openai.com/v1/responses/${encodeURIComponent(
          responseId
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${process.env.OPENAI_API_KEY}`,
          },

          cache:
            "no-store",
        }
      );

    const rawText =
      await openaiResponse.text();

    let data: any;

    try {
      data =
        rawText
          ? JSON.parse(
              rawText
            )
          : null;
    } catch {
      return Response.json(
        {
          error:
            `OpenAI returned an invalid status response. HTTP ${openaiResponse.status}.`,
        },
        {
          status: 502,
        }
      );
    }

    if (
      !openaiResponse.ok
    ) {
      return Response.json(
        {
          error:
            data?.error?.message ||
            `Could not retrieve enhancement status. HTTP ${openaiResponse.status}.`,
        },
        {
          status:
            openaiResponse.status,
        }
      );
    }

    const status =
      data?.status ||
      "unknown";

    /*
      Job still running.
    */

    if (
      status ===
        "queued" ||
      status ===
        "in_progress"
    ) {
      return Response.json({
        status,
      });
    }

    /*
      Job failed.
    */

    if (
      status ===
        "failed"
    ) {
      return Response.json({
        status:
          "failed",

        error:
          data?.error?.message ||
          "The OpenAI enhancement job failed.",
      });
    }

    /*
      Job was cancelled.
    */

    if (
      status ===
        "cancelled"
    ) {
      return Response.json({
        status:
          "cancelled",

        error:
          "The enhancement job was cancelled.",
      });
    }

    /*
      Job ended incomplete.
    */

    if (
      status ===
        "incomplete"
    ) {
      return Response.json({
        status:
          "incomplete",

        error:
          data?.incomplete_details?.reason ||
          "The enhancement job ended before completion.",
      });
    }

    /*
      Unexpected state.
    */

    if (
      status !==
        "completed"
    ) {
      return Response.json({
        status,

        error:
          `Unexpected enhancement status: ${status}`,
      });
    }

    /*
      Completed.

      Find the image-generation result.
    */

    const imageCall =
      Array.isArray(
        data?.output
      )
        ? data.output.find(
            (
              item: any
            ) =>
              item?.type ===
                "image_generation_call" &&
              item?.result
          )
        : null;

    if (
      !imageCall?.result
    ) {
      console.error(
        "Completed background response contained no image:",
        {
          responseId,
          outputTypes:
            Array.isArray(
              data?.output
            )
              ? data.output.map(
                  (
                    item: any
                  ) =>
                    item?.type
                )
              : [],
        }
      );

      return Response.json(
        {
          status:
            "failed",

          error:
            "The enhancement completed but no image result was found.",
        },
        {
          status: 502,
        }
      );
    }

    /*
      Convert OpenAI base64 into raw PNG bytes.

      Browser receives binary image only after
      the background job is finished.
    */

    const imageBuffer =
      Buffer.from(
        imageCall.result,
        "base64"
      );

    console.log(
      "Enhancement background job completed:",
      {
        responseId,

        bytes:
          imageBuffer.length,
      }
    );

    return new Response(
      imageBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "image/png",

          "Content-Length":
            imageBuffer.length.toString(),

          "Cache-Control":
            "no-store",

          "X-CoverLab-Enhancement-Status":
            "completed",
        },
      }
    );
  } catch (error) {
    console.error(
      "Enhancement status error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve enhancement status.",
      },
      {
        status: 500,
      }
    );
  }
}