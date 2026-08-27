export const ASSISTED_REQUEST_STATUSES = [
  "requested",
  "reviewing",
  "quoted",
  "accepted",
  "in_production",
  "declined",
  "completed",
  "cancelled",
] as const;

export type AssistedRequestStatus =
  (typeof ASSISTED_REQUEST_STATUSES)[number];

export const ASSISTED_REQUEST_STATUS_LABELS: Record<
  AssistedRequestStatus,
  string
> = {
  requested: "Requested",
  reviewing: "Reviewing",
  quoted: "Quoted",
  accepted: "Accepted",
  in_production: "In production",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isAssistedRequestStatus(
  value: string
): value is AssistedRequestStatus {
  return (
    ASSISTED_REQUEST_STATUSES as readonly string[]
  ).includes(value);
}
