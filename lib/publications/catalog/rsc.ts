import type { JournalRecord } from "../types";

/*
 * CoverLab AI
 * Royal Society of Chemistry journal identity catalog
 *
 * Official RSC portfolio checked 2026-08-25:
 * - https://www.rsc.org/publishing/journals
 *
 * Identity only: inclusion does not imply verified technical requirements,
 * AI-image policy, or publication eligibility. Those resolve independently.
 */

type RscJournalIdentity = readonly [
  id: string,
  name: string,
  aliases?: readonly string[],
  disciplines?: readonly string[],
];

const RSC_JOURNAL_IDENTITIES: readonly RscJournalIdentity[] = [
  ["rsc-analyst", "Analyst"],
  ["rsc-analytical-methods", "Analytical Methods"],
  ["rsc-biomaterials-science", "Biomaterials Science"],
  ["rsc-catalysis-science-and-technology", "Catalysis Science & Technology"],
  ["rsc-chemical-society-reviews", "Chemical Society Reviews", ["Chem Soc Rev", "CSR"]],
  ["rsc-chemical-communications", "Chemical Communications", ["ChemComm"]],
  ["rsc-chemical-science", "Chemical Science", [], ["Chemistry"]],
  ["rsc-chemistry-education-research-and-practice", "Chemistry Education Research and Practice"],
  ["rsc-crystengcomm", "CrystEngComm"],
  ["rsc-dalton-transactions", "Dalton Transactions"],
  ["rsc-digital-discovery", "Digital Discovery"],
  ["rsc-ees-batteries", "EES Batteries"],
  ["rsc-ees-catalysis", "EES Catalysis"],
  ["rsc-ees-solar", "EES Solar"],
  ["rsc-energy-and-environmental-science", "Energy & Environmental Science", ["EES"]],
  ["rsc-energy-advances", "Energy Advances"],
  ["rsc-environmental-science-advances", "Environmental Science: Advances"],
  ["rsc-environmental-science-atmospheres", "Environmental Science: Atmospheres"],
  ["rsc-environmental-science-nano", "Environmental Science: Nano"],
  ["rsc-environmental-science-processes-and-impacts", "Environmental Science: Processes & Impacts"],
  ["rsc-environmental-science-water-research-and-technology", "Environmental Science: Water Research & Technology"],
  ["rsc-faraday-discussions", "Faraday Discussions"],
  ["rsc-food-and-function", "Food & Function"],
  ["rsc-green-chemistry", "Green Chemistry"],
  ["rsc-industrial-chemistry-and-materials", "Industrial Chemistry & Materials"],
  ["rsc-inorganic-chemistry-frontiers", "Inorganic Chemistry Frontiers"],
  ["rsc-journal-analytical-atomic-spectrometry", "Journal of Analytical Atomic Spectrometry", ["JAAS"]],
  ["rsc-journal-materials-chemistry-a", "Journal of Materials Chemistry A", ["J Mater Chem A"], ["Materials Science", "Energy", "Chemistry"]],
  ["rsc-journal-materials-chemistry-b", "Journal of Materials Chemistry B", ["J Mater Chem B"]],
  ["rsc-journal-materials-chemistry-c", "Journal of Materials Chemistry C", ["J Mater Chem C"]],
  ["rsc-lab-on-a-chip", "Lab on a Chip"],
  ["rsc-materials-advances", "Materials Advances"],
  ["rsc-materials-chemistry-frontiers", "Materials Chemistry Frontiers"],
  ["rsc-materials-horizons", "Materials Horizons", [], ["Materials Science", "Chemistry", "Nanotechnology"]],
  ["rsc-molecular-systems-design-and-engineering", "Molecular Systems Design & Engineering", ["MSDE"]],
  ["rsc-nanoscale", "Nanoscale"],
  ["rsc-nanoscale-advances", "Nanoscale Advances"],
  ["rsc-nanoscale-horizons", "Nanoscale Horizons"],
  ["rsc-natural-product-reports", "Natural Product Reports"],
  ["rsc-new-journal-of-chemistry", "New Journal of Chemistry", ["NJC"]],
  ["rsc-organic-and-biomolecular-chemistry", "Organic & Biomolecular Chemistry", ["OBC"]],
  ["rsc-organic-chemistry-frontiers", "Organic Chemistry Frontiers"],
  ["rsc-physical-chemistry-chemical-physics", "Physical Chemistry Chemical Physics", ["PCCP"]],
  ["rsc-polymer-chemistry", "Polymer Chemistry"],
  ["rsc-reaction-chemistry-and-engineering", "Reaction Chemistry & Engineering"],
  ["rsc-advances", "RSC Advances"],
  ["rsc-applied-interfaces", "RSC Applied Interfaces"],
  ["rsc-applied-polymers", "RSC Applied Polymers"],
  ["rsc-chemical-biology", "RSC Chemical Biology"],
  ["rsc-mechanochemistry", "RSC Mechanochemistry", ["RSC Mechano-chemistry"]],
  ["rsc-medicinal-chemistry", "RSC Medicinal Chemistry"],
  ["rsc-pharmaceutics", "RSC Pharmaceutics"],
  ["rsc-sustainability", "RSC Sustainability"],
  ["rsc-sensors-and-diagnostics", "Sensors & Diagnostics"],
  ["rsc-soft-matter", "Soft Matter"],
  ["rsc-sustainable-energy-and-fuels", "Sustainable Energy & Fuels"],
  ["rsc-sustainable-food-technology", "Sustainable Food Technology"],
];

export const RSC_JOURNALS: JournalRecord[] =
  RSC_JOURNAL_IDENTITIES.map(
    ([id, name, aliases = [], disciplines]) => ({
      id,
      name,
      aliases: [...aliases],
      publisherId: "rsc",
      ...(disciplines
        ? { disciplines: [...disciplines] }
        : {}),
      active: true,
    })
  );
