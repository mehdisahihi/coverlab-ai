import {
  z,
} from "zod";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  createOpenAiClientRequestId,
  logOpenAiHttpFailure,
  logOpenAiSdkError,
  OPENAI_STATUS_TIMEOUT_MS,
  openAiFetch,
} from "@/lib/openai/client";
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
          "private, no-store, max-age=0",
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
  const clientRequestId =
    createOpenAiClientRequestId();

  try {
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
        "Enhancement usage ownership lookup failed."
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

    const openaiResponse =
      await openAiFetch(
        `/responses/${encodeURIComponent(
          responseId
        )}`,
        {
          method: "GET",
        },
        {
          clientRequestId,
          timeoutMs:
            OPENAI_STATUS_TIMEOUT_MS,
        }
      );

    const rawText =
      await openaiResponse.text();

    let data: any = null;

    try {
      data =
        rawText
          ? JSON.parse(rawText)
          : null;
    } catch {
      logOpenAiHttpFailure(
        "Enhancement status returned invalid JSON:",
        openaiResponse,
        clientRequestId
      );

      return Response.json(
        {
          error:
            "The AI provider returned an invalid enhancement-status response.",
        },
        {
          status: 502,
        }
      );
    }

    if (!openaiResponse.ok) {
      logOpenAiHttpFailure(
        "Enhancement status OpenAI HTTP error:",
        openaiResponse,
        clientRequestId
      );

      return Response.json(
        {
          error:
            "Could not retrieve enhancement status from the AI provider.",
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
          "The enhancement did not complete successfully.",
      });
    }

    if (status !== "completed") {
      return Response.json({
        status,
        error:
          "The enhancement returned an unexpected provider status.",
      });
    }

    /*
     * Provider completion and durable persistence are separate.
     * completedJson signals the outer route to finalize billable
     * usage as succeeded even if storage later fails.
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
        "Enhancement destination project lookup failed."
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
        "Enhancement source version lookup failed."
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
        "Enhancement idempotency lookup failed."
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
        "Completed enhancement contained no image result:",
        {
          clientRequestId,
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
        "Completed enhancement storage upload failed."
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
        "Completed enhancement version insert failed:",
        {
          code:
            insertError.code ??
            null,
        }
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
        clientRequestId,
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
    logOpenAiSdkError(
      "Enhancement status request error:",
      error,
      clientRequestId
    );

    return Response.json(
      {
        error:
          "Failed to retrieve enhancement status.",
      },
      {
        status: 502,
      }
    );
  }
}
