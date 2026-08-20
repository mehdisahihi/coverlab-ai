import type {
  PublisherRecord,
} from "./types";

/*
 * CoverLab AI
 * Publication Registry V2
 *
 * Publisher identity dataset.
 *
 * IMPORTANT:
 *
 * This file stores publisher identity only.
 *
 * It does NOT contain:
 *
 * - AI policy
 * - image dimensions
 * - DPI
 * - accepted formats
 * - journal technical requirements
 *
 * Those belong to separate verified datasets.
 */

export const PUBLISHERS: PublisherRecord[] = [
  {
    id: "acs",

    name:
      "American Chemical Society",

    aliases: [
      "ACS",
      "ACS Publications",
      "American Chemical Society Publications",
    ],

    active: true,
  },

  {
    id: "elsevier",

    name:
      "Elsevier",

    aliases: [
      "Elsevier B.V.",
    ],

    active: true,
  },

  {
    id: "wiley",

    name:
      "Wiley",

    aliases: [
      "John Wiley & Sons",
      "Wiley-VCH",
      "Wiley VCH",
    ],

    active: true,
  },

  {
    id: "springer-nature",

    name:
      "Springer Nature",

    aliases: [
      "Springer",
      "SpringerNature",
    ],

    active: true,
  },

  {
    id: "nature-portfolio",

    name:
      "Nature Portfolio",

    aliases: [
      "Nature",
      "Nature Research",
    ],

    active: true,
  },

  {
    id: "taylor-francis",

    name:
      "Taylor & Francis",

    aliases: [
      "Taylor and Francis",
      "T&F",
      "Taylor & Francis Group",
    ],

    active: true,
  },

  {
    id: "rsc",

    name:
      "Royal Society of Chemistry",

    aliases: [
      "RSC",
      "RSC Publishing",
    ],

    active: true,
  },

  {
    id: "aaas",

    name:
      "American Association for the Advancement of Science",

    aliases: [
      "AAAS",
      "Science",
      "Science Journals",
    ],

    active: true,
  },

  {
    id: "mdpi",

    name:
      "MDPI",

    aliases: [
      "Multidisciplinary Digital Publishing Institute",
    ],

    active: true,
  },

  {
    id: "frontiers",

    name:
      "Frontiers",

    aliases: [
      "Frontiers Media",
    ],

    active: true,
  },

  {
    id: "ieee",

    name:
      "IEEE",

    aliases: [
      "Institute of Electrical and Electronics Engineers",
      "IEEE Publications",
    ],

    active: true,
  },

  {
    id: "iop",

    name:
      "IOP Publishing",

    aliases: [
      "IOP",
      "Institute of Physics Publishing",
    ],

    active: true,
  },

  {
    id: "aip",

    name:
      "AIP Publishing",

    aliases: [
      "AIP",
      "American Institute of Physics Publishing",
    ],

    active: true,
  },

  {
    id: "aps",

    name:
      "American Physical Society",

    aliases: [
      "APS",
      "APS Journals",
    ],

    active: true,
  },

  {
    id: "optica",

    name:
      "Optica Publishing Group",

    aliases: [
      "Optica",
      "OSA Publishing",
      "Optical Society of America",
    ],

    active: true,
  },

  {
    id: "plos",

    name:
      "Public Library of Science",

    aliases: [
      "PLOS",
    ],

    active: true,
  },

  {
    id: "oup",

    name:
      "Oxford University Press",

    aliases: [
      "OUP",
      "Oxford Academic",
    ],

    active: true,
  },

  {
    id: "cambridge",

    name:
      "Cambridge University Press & Assessment",

    aliases: [
      "Cambridge University Press",
      "CUP",
      "Cambridge Core",
    ],

    active: true,
  },

  {
    id: "sage",

    name:
      "SAGE Publications",

    aliases: [
      "SAGE",
      "SAGE Publishing",
    ],

    active: true,
  },

  {
    id: "bmj",

    name:
      "BMJ Publishing Group",

    aliases: [
      "BMJ",
      "BMJ Journals",
    ],

    active: true,
  },

  {
    id: "jama-network",

    name:
      "JAMA Network",

    aliases: [
      "JAMA",
    ],

    active: true,
  },

  {
    id: "cell-press",

    name:
      "Cell Press",

    aliases: [
      "CellPress",
    ],

    active: true,
  },

  {
    id: "pnas",

    name:
      "Proceedings of the National Academy of Sciences",

    aliases: [
      "PNAS",
      "National Academy of Sciences",
    ],

    active: true,
  },

  {
    id: "de-gruyter",

    name:
      "De Gruyter Brill",

    aliases: [
      "De Gruyter",
      "Walter de Gruyter",
    ],

    active: true,
  },

  {
    id: "emerald",

    name:
      "Emerald Publishing",

    aliases: [
      "Emerald",
    ],

    active: true,
  },

  {
    id: "thieme",

    name:
      "Thieme",

    aliases: [
      "Thieme Medical Publishers",
      "Georg Thieme Verlag",
    ],

    active: true,
  },

  {
    id: "wolters-kluwer",

    name:
      "Wolters Kluwer",

    aliases: [
      "Lippincott Williams & Wilkins",
      "LWW",
    ],

    active: true,
  },

  {
    id: "asm",

    name:
      "American Society for Microbiology",

    aliases: [
      "ASM",
      "ASM Journals",
    ],

    active: true,
  },

  {
    id: "asme",

    name:
      "American Society of Mechanical Engineers",

    aliases: [
      "ASME",
      "ASME Digital Collection",
    ],

    active: true,
  },

  {
    id: "asce",

    name:
      "American Society of Civil Engineers",

    aliases: [
      "ASCE",
      "ASCE Library",
    ],

    active: true,
  },

  {
    id: "acm",

    name:
      "Association for Computing Machinery",

    aliases: [
      "ACM",
      "ACM Digital Library",
    ],

    active: true,
  },

  {
    id: "spie",

    name:
      "SPIE",

    aliases: [
      "Society of Photo-Optical Instrumentation Engineers",
      "SPIE Digital Library",
    ],

    active: true,
  },
];

export function getPublisherById(
  publisherId: string
) {
  return (
    PUBLISHERS.find(
      (publisher) =>
        publisher.id ===
        publisherId
    ) ?? null
  );
}