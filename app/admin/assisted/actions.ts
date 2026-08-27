"use server";

import {
  redirect,
} from "next/navigation";
import {
  z,
} from "zod";

import {
  getAuthenticatedContext,
} from "@/lib/auth/authenticated";
import {
  ASSISTED_REQUEST_STATUSES,
} from "@/lib/assisted/status";

const updateStatusSchema =
  z.object({
    requestId:
      z.string().uuid(),
    status:
      z.enum(
        ASSISTED_REQUEST_STATUSES
      ),
  });

function formValue(
  formData: FormData,
  name: string
) {
  const value =
    formData.get(name);

  return typeof value ===
    "string"
    ? value
    : "";
}

export async function updateAssistedRequestStatus(
  formData: FormData
) {
  const parsed =
    updateStatusSchema.safeParse({
      requestId:
        formValue(
          formData,
          "requestId"
        ),
      status:
        formValue(
          formData,
          "status"
        ),
    });

  if (!parsed.success) {
    redirect(
      "/admin/assisted?error=invalid_status_update"
    );
  }

  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    redirect(
      "/auth/login?next=%2Fadmin%2Fassisted"
    );
  }

  const {
    error,
  } =
    await supabase.rpc(
      "admin_update_assisted_production_request_status",
      {
        p_request_id:
          parsed.data.requestId,
        p_status:
          parsed.data.status,
      }
    );

  if (error) {
    console.error(
      "Assisted admin status update failed:",
      {
        code:
          error.code,
        message:
          error.message,
      }
    );

    redirect(
      "/admin/assisted?error=update_failed"
    );
  }

  redirect(
    `/admin/assisted?updated=${encodeURIComponent(parsed.data.requestId)}`
  );
}
