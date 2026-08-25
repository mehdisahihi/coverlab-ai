import type { JournalRecord } from "../types";

/*
 * CoverLab AI
 * Wiley journal identity catalog.
 *
 * These manually enriched records preserve existing IDs, aliases,
 * and disciplines relied on by the launch workflow. The larger
 * Wiley portfolio is generated separately in wiley.generated.ts.
 *
 * Identity only: inclusion does not imply verified technical
 * requirements, AI-image policy, or publication eligibility.
 */

export const WILEY_JOURNALS: JournalRecord[] = [
  {
    id: "wiley-advanced-materials",
    name: "Advanced Materials",
    aliases: [],
    publisherId: "wiley",
    disciplines: [
      "Materials Science",
      "Nanotechnology",
      "Chemistry",
      "Physics",
    ],
    active: true,
  },
  {
    id: "wiley-advanced-functional-materials",
    name: "Advanced Functional Materials",
    aliases: ["AFM"],
    publisherId: "wiley",
    disciplines: [
      "Materials Science",
      "Nanotechnology",
      "Applied Physics",
    ],
    active: true,
  },
  {
    id: "wiley-small",
    name: "Small",
    aliases: [],
    publisherId: "wiley",
    disciplines: [
      "Nanotechnology",
      "Materials Science",
      "Chemistry",
    ],
    active: true,
  },
];
