type AssistedProductionNotificationInput = {
  requestId: string;
  serviceType:
    | "graphical_abstract"
    | "journal_cover";
  projectId: string | null;
  contactName: string;
  contactEmail: string;
  institution: string;
  paperTitle: string;
  targetJournal: string;
  researchSummary: string;
  deadline: string;
  notes: string;
};

type NotificationResult =
  | {
      sent: true;
    }
  | {
      sent: false;
      reason:
        | "not_configured"
        | "provider_error";
      status?: number;
    };

const DEFAULT_FROM =
  "CoverLab AI <notifications@coverlabai.com>";

function serviceLabel(
  serviceType: AssistedProductionNotificationInput["serviceType"]
) {
  return serviceType ===
    "journal_cover"
    ? "Journal Cover"
    : "Graphical Abstract";
}

function displayValue(
  value: string | null
) {
  return value?.trim() || "Not provided";
}

function notificationText(
  input: AssistedProductionNotificationInput
) {
  return [
    "New CoverLab-assisted production request",
    "",
    `Request ID: ${input.requestId}`,
    `Service: ${serviceLabel(input.serviceType)}`,
    `Contact: ${input.contactName}`,
    `Email: ${input.contactEmail}`,
    `Institution: ${displayValue(input.institution)}`,
    `Paper title: ${input.paperTitle}`,
    `Target journal: ${displayValue(input.targetJournal)}`,
    `Deadline: ${displayValue(input.deadline)}`,
    `Linked CoverLab project: ${displayValue(input.projectId)}`,
    "",
    "Research summary:",
    input.researchSummary,
    "",
    "Additional notes:",
    displayValue(input.notes),
    "",
    "The request is already stored in Supabase. Review the scope before quoting or requesting payment.",
  ].join("\n");
}

export async function sendAssistedProductionNotification(
  input: AssistedProductionNotificationInput
): Promise<NotificationResult> {
  const apiKey =
    process.env.RESEND_NOTIFICATIONS_API_KEY?.trim();
  const to =
    process.env.ASSISTED_NOTIFICATION_TO?.trim();
  const from =
    process.env.ASSISTED_NOTIFICATION_FROM?.trim() ||
    DEFAULT_FROM;

  if (
    !apiKey ||
    !to
  ) {
    return {
      sent: false,
      reason: "not_configured",
    };
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
          "Idempotency-Key":
            `assisted-request/${input.requestId}`,
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject:
            `New CoverLab assisted request — ${serviceLabel(input.serviceType)}`,
          text:
            notificationText(
              input
            ),
        }),
      }
    );

  if (!response.ok) {
    return {
      sent: false,
      reason:
        "provider_error",
      status:
        response.status,
    };
  }

  return {
    sent: true,
  };
}
