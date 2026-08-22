import {
  z,
} from "zod";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  ARTWORK_VERSION_BUCKET,
  ARTWORK_VERSION_MAX_BYTES,
  expectedArtworkVersionPath,
} from "@/lib/storage/artworkVersions";

const uuidSchema =
  z.string().uuid();

function completedJson(
  body: unknown,
  status = 200
) {
  return Response.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
        "X-CoverLab-Enhancement-Status":
          "completed",
      },
    }
  );
}

function optionalPositiveInteger(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
}

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
    const projectId =
      url.searchParams.get(
        "projectId"
      );
    const sourceVersionId =
      url.searchParams.get(
        "sourceVersionId"
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

    if (
      !projectId ||
      !uuidSchema.safeParse(
        projectId
      ).success
    ) {
      return Response.json(
        {
          error:
            "A valid project ID is required while polling enhancement status.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !sourceVersionId ||
      !uuidSchema.safeParse(
        sourceVersionId
      ).success
    ) {
      return Response.json(
        {
          error:
            "A valid source artwork version is required while polling enhancement status.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      supabase,
      userId,
    } =
      await getAuthenticatedContext();

    if (!userId) {
      return Response.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * A background response ID may only be polled
     * by the authenticated user who reserved the
     * enhancement operation.
     */

    const {
      data: usageEvent,
      error: usageLookupError,
    } =
      await supabase
        .from("ai_usage_events")
        .select("id")
        .eq(
          "provider_response_id",
          responseId
        )
        .eq(
          "user_id",
          userId
        )
        .eq(
          "operation",
          "enhancement"
        )
        .maybeSingle();

    if (usageLookupError) {
      console.error(
        "Enhancement usage ownership lookup error:",
        usageLookupError
      );

      return Response.json(
        {
          error:
            "Could not verify enhancement ownership.",
        },
        {
          status: 500,
        }
      );
    }

    if (!usageEvent) {
      return Response.json(
        {
          error:
            "Enhancement response not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Retrieve the current OpenAI background state.
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
          cache: "no-store",
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

    if (!openaiResponse.ok) {
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

    if (
      status === "queued" ||
      status === "in_progress"
    ) {
      return Response.json({
        status,
      });
    }

    if (
      status === "failed" ||
      status === "cancelled" ||
      status === "incomplete"
    ) {
      return Response.json({
        status,
        error:
          data?.error?.message ||
          data?.incomplete_details?.reason ||
          `Enhancement ended with status: ${status}`,
      });
    }

    if (status !== "completed") {
      return Response.json({
        status,
        error:
          `Unexpected enhancement status: ${status}`,
      });
    }

    /*
     * From this point forward the provider job has
     * completed. Even if durable persistence fails,
     * the outer route must finalize billable usage as
     * succeeded. completedJson carries that signal.
     */

    const {
      data: project,
      error: projectError,
    } =
      await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .maybeSingle();

    if (projectError) {
      console.error(
        "Enhancement project lookup error:",
        projectError
      );

      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed, but CoverLab could not verify the destination project.",
        },
        500
      );
    }

    if (!project) {
      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed, but the destination project was not found.",
        },
        404
      );
    }

    const {
      data: sourceVersion,
      error: sourceError,
    } =
      await supabase
        .from("project_versions")
        .select("id")
        .eq(
          "id",
          sourceVersionId
        )
        .eq(
          "project_id",
          projectId
        )
        .eq(
          "user_id",
          userId
        )
        .maybeSingle();

    if (sourceError) {
      console.error(
        "Enhancement source version lookup error:",
        sourceError
      );

      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed, but CoverLab could not verify its source artwork version.",
        },
        500
      );
    }

    if (!sourceVersion) {
      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed, but its source artwork version was not found.",
        },
        400
      );
    }

    /*
     * Idempotency by provider response ID means a
     * browser retry after a network interruption never
     * creates a second enhancement version.
     */

    const {
      data: existing,
      error: existingError,
    } =
      await supabase
        .from("project_versions")
        .select("*")
        .eq(
          "project_id",
          projectId
        )
        .eq(
          "user_id",
          userId
        )
        .eq(
          "operation",
          "enhancement"
        )
        .contains(
          "metadata",
          {
            providerResponseId:
              responseId,
          }
        )
        .maybeSingle();

    if (existingError) {
      console.error(
        "Enhancement idempotency lookup error:",
        existingError
      );

      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed, but CoverLab could not verify whether it was already stored.",
        },
        500
      );
    }

    if (existing) {
      return completedJson({
        status:
          "completed",
        version:
          existing,
        alreadyStored:
          true,
      });
    }

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

    if (!imageCall?.result) {
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

      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed but no image result was found.",
        },
        502
      );
    }

    const imageBuffer =
      Buffer.from(
        imageCall.result,
        "base64"
      );

    if (
      imageBuffer.length <= 0 ||
      imageBuffer.length >
        ARTWORK_VERSION_MAX_BYTES
    ) {
      return completedJson(
        {
          status:
            "completed",
          error:
            "The completed enhancement image is outside CoverLab's private storage size limits.",
        },
        502
      );
    }

    const versionId =
      crypto.randomUUID();
    const imagePath =
      expectedArtworkVersionPath(
        userId,
        projectId,
        versionId
      );

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          ARTWORK_VERSION_BUCKET
        )
        .upload(
          imagePath,
          imageBuffer,
          {
            cacheControl:
              "3600",
            contentType:
              "image/png",
            upsert:
              false,
          }
        );

    if (uploadError) {
      console.error(
        "Completed enhancement storage upload error:",
        uploadError
      );

      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed, but CoverLab could not store the image in private project storage.",
        },
        500
      );
    }

    const targetWidth =
      optionalPositiveInteger(
        url.searchParams.get(
          "targetWidth"
        )
      );
    const targetHeight =
      optionalPositiveInteger(
        url.searchParams.get(
          "targetHeight"
        )
      );
    const enhancementWidth =
      optionalPositiveInteger(
        url.searchParams.get(
          "enhancementWidth"
        )
      );
    const enhancementHeight =
      optionalPositiveInteger(
        url.searchParams.get(
          "enhancementHeight"
        )
      );

    const metadata = {
      label:
        "Detail-enhanced candidate",
      providerResponseId:
        responseId,
      sizeBytes:
        imageBuffer.length,
      mimeType:
        "image/png",
      ...(targetWidth
        ? {
            targetWidth,
          }
        : {}),
      ...(targetHeight
        ? {
            targetHeight,
          }
        : {}),
      ...(enhancementWidth
        ? {
            enhancementWidth,
          }
        : {}),
      ...(enhancementHeight
        ? {
            enhancementHeight,
          }
        : {}),
    };

    const {
      data: storedVersion,
      error: insertError,
    } =
      await supabase
        .from("project_versions")
        .insert({
          id:
            versionId,
          project_id:
            projectId,
          user_id:
            userId,
          operation:
            "enhancement",
          source_version_id:
            sourceVersionId,
          image_path:
            imagePath,
          metadata,
        })
        .select("*")
        .single();

    if (insertError) {
      await supabase.storage
        .from(
          ARTWORK_VERSION_BUCKET
        )
        .remove([
          imagePath,
        ]);

      if (
        insertError.code ===
        "23505"
      ) {
        const {
          data: racedVersion,
        } =
          await supabase
            .from("project_versions")
            .select("*")
            .eq(
              "project_id",
              projectId
            )
            .eq(
              "user_id",
              userId
            )
            .eq(
              "operation",
              "enhancement"
            )
            .contains(
              "metadata",
              {
                providerResponseId:
                  responseId,
              }
            )
            .maybeSingle();

        if (racedVersion) {
          return completedJson({
            status:
              "completed",
            version:
              racedVersion,
            alreadyStored:
              true,
          });
        }
      }

      console.error(
        "Completed enhancement version insert error:",
        insertError
      );

      return completedJson(
        {
          status:
            "completed",
          error:
            "The enhancement completed, but CoverLab could not record the private artwork version.",
        },
        500
      );
    }

    console.log(
      "Enhancement background job stored:",
      {
        responseId,
        versionId,
        bytes:
          imageBuffer.length,
      }
    );

    return completedJson(
      {
        status:
          "completed",
        version:
          storedVersion,
        alreadyStored:
          false,
      },
      201
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
