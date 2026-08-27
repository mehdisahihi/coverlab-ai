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

const assistedRequestSchema =
  z.object({
    serviceType:
      z.enum([
        "graphical_abstract",
        "journal_cover",
      ]),
    projectId:
      z.union([
        z.literal(""),
        z.string().uuid(),
      ]),
    contactName:
      z.string()
        .trim()
        .min(2)
        .max(120),
    contactEmail:
      z.string()
        .trim()
        .email()
        .max(320),
    institution:
      z.string()
        .trim()
        .max(200),
    paperTitle:
      z.string()
        .trim()
        .min(3)
        .max(500),
    targetJournal:
      z.string()
        .trim()
        .max(200),
    researchSummary:
      z.string()
        .trim()
        .min(20)
        .max(6000),
    deadline:
      z.union([
        z.literal(""),
        z.string().regex(
          /^\d{4}-\d{2}-\d{2}$/
        ),
      ]),
    notes:
      z.string()
        .trim()
        .max(4000),
  });

type ServiceType =
  "graphical_abstract" |
  "journal_cover";

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

function safeServiceType(
  value: string
): ServiceType {
  return value ===
    "journal_cover"
    ? "journal_cover"
    : "graphical_abstract";
}

function formErrorPath(
  message: string,
  serviceType: ServiceType
) {
  const params =
    new URLSearchParams({
      error: message,
      service:
        serviceType,
    });

  return `/assisted?${params.toString()}`;
}

export async function submitAssistedRequest(
  formData: FormData
) {
  const rawServiceType =
    formValue(
      formData,
      "serviceType"
    );

  const serviceType =
    safeServiceType(
      rawServiceType
    );

  const {
    supabase,
    userId,
  } =
    await getAuthenticatedContext();

  if (!userId) {
    const next =
      encodeURIComponent(
        `/assisted?service=${serviceType}`
      );

    redirect(
      `/auth/login?next=${next}`
    );
  }

  const parsed =
    assistedRequestSchema.safeParse({
      serviceType:
        rawServiceType,
      projectId:
        formValue(
          formData,
          "projectId"
        ),
      contactName:
        formValue(
          formData,
          "contactName"
        ),
      contactEmail:
        formValue(
          formData,
          "contactEmail"
        ),
      institution:
        formValue(
          formData,
          "institution"
        ),
      paperTitle:
        formValue(
          formData,
          "paperTitle"
        ),
      targetJournal:
        formValue(
          formData,
          "targetJournal"
        ),
      researchSummary:
        formValue(
          formData,
          "researchSummary"
        ),
      deadline:
        formValue(
          formData,
          "deadline"
        ),
      notes:
        formValue(
          formData,
          "notes"
        ),
    });

  if (!parsed.success) {
    redirect(
      formErrorPath(
        "Please review the required fields and try again.",
        serviceType
      )
    );
  }

  const request =
    parsed.data;

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "assisted_production_requests"
      )
      .insert({
        user_id:
          userId,
        project_id:
          request.projectId ||
          null,
        service_type:
          request.serviceType,
        contact_name:
          request.contactName,
        contact_email:
          request.contactEmail,
        institution:
          request.institution,
        paper_title:
          request.paperTitle,
        target_journal:
          request.targetJournal,
        research_summary:
          request.researchSummary,
        deadline:
          request.deadline ||
          null,
        notes:
          request.notes,
        status:
          "requested",
      })
      .select(
        "id"
      )
      .single();

  if (
    error ||
    !data?.id
  ) {
    console.error(
      "Assisted production request insert failed:",
      {
        code:
          error?.code ??
          "UNKNOWN",
        message:
          error?.message ??
          "No request id returned",
      }
    );

    redirect(
      formErrorPath(
        "We could not save your request. Please try again.",
        request.serviceType
      )
    );
  }

  redirect(
    `/assisted/thanks?id=${encodeURIComponent(data.id)}`
  );
}
