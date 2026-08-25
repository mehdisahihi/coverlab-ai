import type {
  JournalRecord,
} from "./types";

import {
  ACS_JOURNALS,
} from "./catalog/acs";

import {
  ELSEVIER_JOURNALS,
} from "./catalog/elsevier";

/*
 * CoverLab AI
 * Publication Registry V2
 *
 * Central journal catalog aggregator.
 *
 * IMPORTANT:
 *
 * Journal identity is separate from:
 *
 * - technical publication requirements,
 * - dimensions,
 * - DPI,
 * - file formats,
 * - AI policy,
 * - publication eligibility.
 *
 * A journal appearing in this catalog does
 * NOT mean CoverLab has verified technical
 * requirements or AI policy for it.
 *
 * Large publisher catalogs live in:
 *
 *   lib/publications/catalog/
 */

export const JOURNALS: JournalRecord[] = [
  /*
   * ACS
   *
   * ACS identity records now live in:
   *
   *   catalog/acs.ts
   */

  ...ACS_JOURNALS,

  /*
   * Elsevier
   *
   * Elsevier identity records now live in:
   *
   *   catalog/elsevier.ts
   */

  ...ELSEVIER_JOURNALS,

  /*
   * Wiley
   */

  {
    id: "wiley-advanced-materials",

    name:
      "Advanced Materials",

    aliases: [],

    publisherId:
      "wiley",

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

    name:
      "Advanced Functional Materials",

    aliases: [
      "AFM",
    ],

    publisherId:
      "wiley",

    disciplines: [
      "Materials Science",
      "Nanotechnology",
      "Applied Physics",
    ],

    active: true,
  },

  {
    id: "wiley-small",

    name:
      "Small",

    aliases: [],

    publisherId:
      "wiley",

    disciplines: [
      "Nanotechnology",
      "Materials Science",
      "Chemistry",
    ],

    active: true,
  },

  /*
   * Nature Portfolio
   */

  {
    id: "nature-nature",

    name:
      "Nature",

    aliases: [],

    publisherId:
      "nature-portfolio",

    disciplines: [
      "Multidisciplinary",
    ],

    active: true,
  },

  {
    id: "nature-nature-communications",

    name:
      "Nature Communications",

    aliases: [
      "Nat Commun",
    ],

    publisherId:
      "nature-portfolio",

    disciplines: [
      "Multidisciplinary",
    ],

    active: true,
  },

  {
    id: "nature-nature-materials",

    name:
      "Nature Materials",

    aliases: [
      "Nat Mater",
    ],

    publisherId:
      "nature-portfolio",

    disciplines: [
      "Materials Science",
      "Nanotechnology",
      "Physics",
      "Chemistry",
    ],

    active: true,
  },

  {
    id: "nature-scientific-reports",

    name:
      "Scientific Reports",

    aliases: [
      "Sci Rep",
    ],

    publisherId:
      "nature-portfolio",

    disciplines: [
      "Multidisciplinary",
    ],

    active: true,
  },

  /*
   * RSC
   */

  {
    id: "rsc-materials-horizons",

    name:
      "Materials Horizons",

    aliases: [],

    publisherId:
      "rsc",

    disciplines: [
      "Materials Science",
      "Chemistry",
      "Nanotechnology",
    ],

    active: true,
  },

  {
    id: "rsc-journal-materials-chemistry-a",

    name:
      "Journal of Materials Chemistry A",

    aliases: [
      "J Mater Chem A",
    ],

    publisherId:
      "rsc",

    disciplines: [
      "Materials Science",
      "Energy",
      "Chemistry",
    ],

    active: true,
  },

  {
    id: "rsc-chemical-science",

    name:
      "Chemical Science",

    aliases: [],

    publisherId:
      "rsc",

    disciplines: [
      "Chemistry",
    ],

    active: true,
  },

  /*
   * AAAS / Science
   */

  {
    id: "aaas-science",

    name:
      "Science",

    aliases: [],

    publisherId:
      "aaas",

    disciplines: [
      "Multidisciplinary",
    ],

    active: true,
  },

  {
    id: "aaas-science-advances",

    name:
      "Science Advances",

    aliases: [],

    publisherId:
      "aaas",

    disciplines: [
      "Multidisciplinary",
    ],

    active: true,
  },

  /*
   * PLOS
   */

  {
    id: "plos-one",

    name:
      "PLOS ONE",

    aliases: [
      "PLoS ONE",
    ],

    publisherId:
      "plos",

    disciplines: [
      "Multidisciplinary",
    ],

    active: true,
  },

  {
    id: "plos-biology",

    name:
      "PLOS Biology",

    aliases: [
      "PLoS Biology",
    ],

    publisherId:
      "plos",

    disciplines: [
      "Biology",
      "Life Sciences",
    ],

    active: true,
  },

  {
    id: "plos-computational-biology",

    name:
      "PLOS Computational Biology",

    aliases: [
      "PLoS Computational Biology",
    ],

    publisherId:
      "plos",

    disciplines: [
      "Computational Biology",
      "Bioinformatics",
      "Life Sciences",
    ],

    active: true,
  },

  /*
   * IEEE
   */

  {
    id: "ieee-transactions-medical-imaging",

    name:
      "IEEE Transactions on Medical Imaging",

    aliases: [
      "TMI",
    ],

    publisherId:
      "ieee",

    disciplines: [
      "Medical Imaging",
      "Biomedical Engineering",
      "Computer Science",
    ],

    active: true,
  },

  {
    id: "ieee-transactions-pattern-analysis-machine-intelligence",

    name:
      "IEEE Transactions on Pattern Analysis and Machine Intelligence",

    aliases: [
      "TPAMI",
      "IEEE TPAMI",
    ],

    publisherId:
      "ieee",

    disciplines: [
      "Computer Science",
      "Artificial Intelligence",
      "Computer Vision",
    ],

    active: true,
  },

  /*
   * Frontiers
   */

  {
    id: "frontiers-bioengineering-biotechnology",

    name:
      "Frontiers in Bioengineering and Biotechnology",

    aliases: [],

    publisherId:
      "frontiers",

    disciplines: [
      "Bioengineering",
      "Biotechnology",
      "Biomedical Engineering",
    ],

    active: true,
  },

  {
    id: "frontiers-neuroscience",

    name:
      "Frontiers in Neuroscience",

    aliases: [],

    publisherId:
      "frontiers",

    disciplines: [
      "Neuroscience",
      "Medicine",
      "Biology",
    ],

    active: true,
  },

  /*
   * MDPI
   */

  {
    id: "mdpi-materials",

    name:
      "Materials",

    aliases: [],

    publisherId:
      "mdpi",

    disciplines: [
      "Materials Science",
    ],

    active: true,
  },

  {
    id: "mdpi-sensors",

    name:
      "Sensors",

    aliases: [],

    publisherId:
      "mdpi",

    disciplines: [
      "Sensors",
      "Engineering",
      "Electronics",
    ],

    active: true,
  },

  /*
   * Physics
   */

  {
    id: "aps-physical-review-letters",

    name:
      "Physical Review Letters",

    aliases: [
      "PRL",
    ],

    publisherId:
      "aps",

    disciplines: [
      "Physics",
    ],

    active: true,
  },

  {
    id: "iop-nanotechnology",

    name:
      "Nanotechnology",

    aliases: [],

    publisherId:
      "iop",

    disciplines: [
      "Nanotechnology",
      "Physics",
      "Materials Science",
    ],

    active: true,
  },

  /*
   * Medicine
   */

  {
    id: "bmj-bmj",

    name:
      "The BMJ",

    aliases: [
      "BMJ",
    ],

    publisherId:
      "bmj",

    disciplines: [
      "Medicine",
      "Clinical Medicine",
      "Public Health",
    ],

    active: true,
  },

  {
    id: "jama-jama",

    name:
      "JAMA",

    aliases: [
      "Journal of the American Medical Association",
    ],

    publisherId:
      "jama-network",

    disciplines: [
      "Medicine",
      "Clinical Medicine",
    ],

    active: true,
  },

  /*
   * Computing
   */

  {
    id: "acm-communications",

    name:
      "Communications of the ACM",

    aliases: [
      "CACM",
    ],

    publisherId:
      "acm",

    disciplines: [
      "Computer Science",
    ],

    active: true,
  },
];


/* =========================================================
   Identity helpers
   ========================================================= */

export function getJournalById(
  journalId: string
) {
  return (
    JOURNALS.find(
      (journal) =>
        journal.id ===
        journalId
    ) ?? null
  );
}


export function getJournalsByPublisherId(
  publisherId: string
) {
  return JOURNALS.filter(
    (journal) =>
      journal.publisherId ===
      publisherId
  );
}
