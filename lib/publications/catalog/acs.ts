import type { JournalRecord } from "../types";

/*
 * CoverLab AI
 * ACS journal identity catalog
 *
 * Official ACS portfolio references checked 2026-08-25:
 * - https://pubs.acs.org/journals
 * - https://pubs.acs.org/journal-metrics
 *
 * Identity only: inclusion does not imply verified technical requirements,
 * AI-image policy, or publication eligibility. Those resolve independently.
 * Announced ACS titles accepting submissions before first issue are included.
 */

type AcsJournalIdentity = readonly [
  id: string,
  name: string,
  aliases?: readonly string[],
  disciplines?: readonly string[],
];

const ACS_JOURNAL_IDENTITIES: readonly AcsJournalIdentity[] = [
  ["acs-accounts-of-chemical-research", "Accounts of Chemical Research"],
  ["acs-accounts-of-materials-research", "Accounts of Materials Research"],
  ["acs-agricultural-science-and-technology", "ACS Agricultural Science & Technology"],
  ["acs-applied-bio-materials", "ACS Applied Bio Materials"],
  ["acs-applied-catalysis", "ACS Applied Catalysis"],
  ["acs-applied-electronic-materials", "ACS Applied Electronic Materials"],
  ["acs-applied-energy-materials", "ACS Applied Energy Materials"],
  ["acs-applied-engineering-materials", "ACS Applied Engineering Materials"],
  ["acs-applied-materials-and-interfaces", "ACS Applied Materials & Interfaces"],
  ["acs-applied-nano-materials", "ACS Applied Nano Materials"],
  ["acs-applied-optical-materials", "ACS Applied Optical Materials"],
  ["acs-applied-polymer-materials", "ACS Applied Polymer Materials"],
  ["acs-bio-and-med-chem-au", "ACS Bio & Med Chem Au"],
  ["acs-biomaterials-science-and-engineering", "ACS Biomaterials Science & Engineering"],
  ["acs-catalysis", "ACS Catalysis"],
  ["acs-central-science", "ACS Central Science"],
  ["acs-chemical-biology", "ACS Chemical Biology"],
  ["acs-chemical-health-and-safety", "ACS Chemical Health & Safety"],
  ["acs-chemical-neuroscience", "ACS Chemical Neuroscience"],
  ["acs-earth-and-space-chemistry", "ACS Earth and Space Chemistry"],
  ["acs-electrochemistry", "ACS Electrochemistry"],
  ["acs-energy-letters", "ACS Energy Letters"],
  ["acs-engineering-au", "ACS Engineering Au"],
  ["acs-environmental-au", "ACS Environmental Au"],
  ["acs-es-t-air", "ACS ES&T Air"],
  ["acs-es-t-engineering", "ACS ES&T Engineering"],
  ["acs-es-t-toxicology", "ACS ES&T Toxicology"],
  ["acs-es-t-water", "ACS ES&T Water"],
  ["acs-food-science-and-technology", "ACS Food Science & Technology"],
  ["acs-infectious-diseases", "ACS Infectious Diseases"],
  ["acs-macro-letters", "ACS Macro Letters"],
  ["acs-materials-au", "ACS Materials Au"],
  ["acs-materials-letters", "ACS Materials Letters"],
  ["acs-measurement-science-au", "ACS Measurement Science Au"],
  ["acs-medicinal-chemistry-letters", "ACS Medicinal Chemistry Letters"],
  ["acs-nano", "ACS Nano", [], ["Nanoscience", "Nanotechnology", "Materials Science", "Chemistry"]],
  ["acs-nano-medicine", "ACS Nano Medicine"],
  ["acs-nanoscience-au", "ACS Nanoscience Au"],
  ["acs-nutrition-science", "ACS Nutrition Science"],
  ["acs-omega", "ACS Omega"],
  ["acs-organic-and-inorganic-au", "ACS Organic & Inorganic Au"],
  ["acs-pharmacology-and-translational-science", "ACS Pharmacology & Translational Science"],
  ["acs-photonics", "ACS Photonics"],
  ["acs-physical-chemistry-au", "ACS Physical Chemistry Au"],
  ["acs-polymers-au", "ACS Polymers Au"],
  ["acs-sensors", "ACS Sensors"],
  ["acs-sustainable-chemistry-and-engineering", "ACS Sustainable Chemistry & Engineering"],
  ["acs-sustainable-resource-management", "ACS Sustainable Resource Management"],
  ["acs-synthetic-biology", "ACS Synthetic Biology"],
  ["acs-analytical-chemistry", "Analytical Chemistry"],
  ["acs-artificial-photosynthesis", "Artificial Photosynthesis"],
  ["acs-biochemistry", "Biochemistry"],
  ["acs-bioconjugate-chemistry", "Bioconjugate Chemistry"],
  ["acs-biomacromolecules", "Biomacromolecules"],
  ["acs-chem-and-bio-engineering", "Chem & Bio Engineering"],
  ["acs-chemical-and-biomedical-imaging", "Chemical & Biomedical Imaging"],
  ["acs-chemical-research-in-toxicology", "Chemical Research in Toxicology"],
  ["acs-chemical-reviews", "Chemical Reviews"],
  ["acs-chemistry-of-materials", "Chemistry of Materials"],
  ["acs-crystal-growth-and-design", "Crystal Growth & Design"],
  ["acs-digital-medical-engineering", "Digital Medical Engineering"],
  ["acs-energy-and-fuels", "Energy & Fuels"],
  ["acs-environment-and-health", "Environment & Health"],
  ["acs-environmental-health-perspectives", "Environmental Health Perspectives"],
  ["acs-environmental-science-and-technology", "Environmental Science & Technology"],
  ["acs-environmental-science-and-technology-letters", "Environmental Science & Technology Letters"],
  ["acs-industrial-and-engineering-chemistry-research", "Industrial & Engineering Chemistry Research"],
  ["acs-inorganic-chemistry", "Inorganic Chemistry"],
  ["acs-jacs-au", "JACS Au"],
  ["acs-journal-of-agricultural-and-food-chemistry", "Journal of Agricultural and Food Chemistry"],
  ["acs-journal-of-chemical-and-engineering-data", "Journal of Chemical & Engineering Data"],
  ["acs-journal-of-chemical-education", "Journal of Chemical Education"],
  ["acs-journal-of-chemical-information-and-modeling", "Journal of Chemical Information and Modeling"],
  ["acs-journal-of-chemical-theory-and-computation", "Journal of Chemical Theory and Computation"],
  ["acs-journal-of-medicinal-chemistry", "Journal of Medicinal Chemistry"],
  ["acs-journal-of-natural-products", "Journal of Natural Products"],
  ["acs-journal-of-proteome-research", "Journal of Proteome Research"],
  ["acs-jacs", "Journal of the American Chemical Society", ["JACS"], ["Chemistry"]],
  ["acs-journal-of-the-american-society-for-mass-spectrometry", "Journal of the American Society for Mass Spectrometry"],
  ["acs-the-journal-of-organic-chemistry", "The Journal of Organic Chemistry"],
  ["acs-the-journal-of-physical-chemistry-a", "The Journal of Physical Chemistry A"],
  ["acs-the-journal-of-physical-chemistry-b", "The Journal of Physical Chemistry B"],
  ["acs-the-journal-of-physical-chemistry-c", "The Journal of Physical Chemistry C"],
  ["acs-the-journal-of-physical-chemistry-letters", "The Journal of Physical Chemistry Letters"],
  ["acs-langmuir", "Langmuir", [], ["Chemistry", "Surface Science", "Colloid Science", "Materials Science"]],
  ["acs-macromolecules", "Macromolecules"],
  ["acs-molecular-pharmaceutics", "Molecular Pharmaceutics"],
  ["acs-nano-letters", "Nano Letters"],
  ["acs-organic-letters", "Organic Letters"],
  ["acs-organic-process-research-and-development", "Organic Process Research & Development"],
  ["acs-organometallics", "Organometallics"],
  ["acs-photon-science", "Photon Science"],
  ["acs-polymer-science-and-technology", "Polymer Science & Technology"],
  ["acs-precision-chemistry", "Precision Chemistry"],
];

export const ACS_JOURNALS: JournalRecord[] =
  ACS_JOURNAL_IDENTITIES.map(
    ([id, name, aliases = [], disciplines]) => ({
      id,
      name,
      aliases: [...aliases],
      publisherId: "acs",
      ...(disciplines
        ? { disciplines: [...disciplines] }
        : {}),
      active: true,
    })
  );
