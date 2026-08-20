export type ValidationStatus =
  | "allowed"
  | "restricted"
  | "not-allowed"
  | "manual-check";

export type ExportProfile = {
  id: string;

  publisher: string;
  journal?: string;
  artworkType: string;

  widthPx: number;
  heightPx: number;
  dpi: number;

  widthPhysical?: string;
  heightPhysical?: string;

  format: "PNG" | "TIFF" | "JPEG";

  aiStatus: ValidationStatus;
  disclosureRequired: boolean | null;

  mastheadSafeAreaPx?: number;

  notes: string[];
};

export const exportProfiles: ExportProfile[] = [
  {
    id: "acs-cover",

    publisher: "ACS",
    artworkType: "Front Cover",

    widthPx: 2457,
    heightPx: 3000,
    dpi: 300,

    widthPhysical: "8.19 in",
    heightPhysical: "10.00 in",

    format: "PNG",

    aiStatus: "allowed",
    disclosureRequired: true,

    mastheadSafeAreaPx: 600,

    notes: [
      "AI-generated cover artwork is permitted under current ACS policy when appropriately disclosed.",
      "Final journal-specific author guidelines should still be checked.",
      "Keep important scientific content away from the upper masthead region.",
    ],
  },

  {
    id: "acs-supplementary-cover",

    publisher: "ACS",
    artworkType: "Supplementary Cover",

    widthPx: 2457,
    heightPx: 3000,
    dpi: 300,

    widthPhysical: "8.19 in",
    heightPhysical: "10.00 in",

    format: "PNG",

    aiStatus: "allowed",
    disclosureRequired: true,

    mastheadSafeAreaPx: 600,

    notes: [
      "AI use must be disclosed according to current ACS guidance.",
      "Journal-specific cover instructions may add additional requirements.",
    ],
  },

  {
    id: "elsevier-graphical-abstract",

    publisher: "Elsevier",
    artworkType: "Graphical Abstract",

    widthPx: 1328,
    heightPx: 531,
    dpi: 300,

    widthPhysical: "13 cm",
    heightPhysical: "5 cm",

    format: "PNG",

    aiStatus: "restricted",
    disclosureRequired: null,

    notes: [
      "Current Elsevier graphical-abstract guidance requires alignment with its generative-AI policy.",
      "The graphical abstract should use approximately a 2.5:1 landscape ratio.",
      "Verify the target journal's current AI-image policy before submission.",
    ],
  },

  {
    id: "rsc-graphical-abstract",

    publisher: "RSC",
    artworkType: "Graphical Abstract",

    widthPx: 1890,
    heightPx: 945,
    dpi: 600,

    widthPhysical: "8 cm",
    heightPhysical: "4 cm",

    format: "TIFF",

    aiStatus: "manual-check",
    disclosureRequired: true,

    notes: [
      "Many RSC journals specify an 8 cm × 4 cm maximum TOC graphic.",
      "600 dpi or greater is specified in current guidance for journals such as Nanoscale.",
      "AI requirements should be checked against the exact RSC journal.",
    ],
  },

  {
    id: "wiley-generic-image",

    publisher: "Wiley",
    artworkType: "Graphical Abstract",

    widthPx: 1800,
    heightPx: 1200,
    dpi: 300,

    format: "PNG",

    aiStatus: "manual-check",
    disclosureRequired: null,

    notes: [
      "Wiley requirements vary substantially by journal.",
      "The current generic figure guidance recommends 300 dpi for images and 600 dpi for line art.",
      "Exact graphical-abstract or cover dimensions must be verified for the selected journal.",
    ],
  },

  {
    id: "springer-ai-image",

    publisher: "Springer Nature",
    artworkType: "Front Cover",

    widthPx: 2480,
    heightPx: 3508,
    dpi: 300,

    format: "TIFF",

    aiStatus: "not-allowed",
    disclosureRequired: true,

    notes: [
      "Springer Nature currently generally does not permit generative-AI images for publication except specified exceptions.",
      "Do not treat this export profile as submission approval.",
      "Manual editorial verification is required.",
    ],
  },
];

export function findExportProfile(
  publisher: string,
  artworkType: string
) {
  return (
    exportProfiles.find(
      (profile) =>
        profile.publisher === publisher &&
        profile.artworkType === artworkType
    ) ?? null
  );
}