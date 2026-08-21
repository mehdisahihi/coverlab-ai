import {
  z,
} from "zod";

const optionalText = (
  max: number
) =>
  z
    .string()
    .trim()
    .max(max)
    .optional();

export const projectMutationSchema =
  z
    .object({
      name:
        optionalText(200),
      researchTitle:
        optionalText(500),
      researchAbstract:
        optionalText(20000),
      researchKeywords:
        optionalText(5000),
      publisher:
        optionalText(500),
      journal:
        optionalText(500),
      artworkType:
        optionalText(100),
      currentStep:
        z
          .number()
          .int()
          .min(1)
          .max(8)
          .optional(),
      state:
        z
          .record(
            z.unknown()
          )
          .optional(),
    })
    .strict();

export type ProjectMutationInput =
  z.infer<
    typeof projectMutationSchema
  >;

export function toProjectRow(
  input: ProjectMutationInput
) {
  return {
    ...(input.name !==
    undefined
      ? {
          name:
            input.name ||
            "Untitled project",
        }
      : {}),
    ...(input.researchTitle !==
    undefined
      ? {
          research_title:
            input.researchTitle,
        }
      : {}),
    ...(input.researchAbstract !==
    undefined
      ? {
          research_abstract:
            input.researchAbstract,
        }
      : {}),
    ...(input.researchKeywords !==
    undefined
      ? {
          research_keywords:
            input.researchKeywords,
        }
      : {}),
    ...(input.publisher !==
    undefined
      ? {
          publisher:
            input.publisher,
        }
      : {}),
    ...(input.journal !==
    undefined
      ? {
          journal:
            input.journal,
        }
      : {}),
    ...(input.artworkType !==
    undefined
      ? {
          artwork_type:
            input.artworkType,
        }
      : {}),
    ...(input.currentStep !==
    undefined
      ? {
          current_step:
            input.currentStep,
        }
      : {}),
    ...(input.state !==
    undefined
      ? {
          state:
            input.state,
        }
      : {}),
  };
}
