export type AiUsageOperation =
  | "concepts"
  | "production-brief"
  | "generation"
  | "refinement"
  | "enhancement";

export type AiUsageTarget = {
  operation: AiUsageOperation;
  model: string;
};

export function resolveAiUsageTarget(
  method: string,
  pathname: string
): AiUsageTarget | null {
  if (method.toUpperCase() !== "POST") {
    return null;
  }

  switch (pathname) {
    case "/api/concepts":
      return {
        operation: "concepts",
        model: "gpt-5.6-luna",
      };

    case "/api/production-brief":
      return {
        operation: "production-brief",
        model: "gpt-5.6-luna",
      };

    case "/api/generate-artwork":
      return {
        operation: "generation",
        model: "gpt-5.6",
      };

    case "/api/refine-artwork":
      return {
        operation: "refinement",
        model: "gpt-image-2",
      };

    case "/api/enhance-publication-artwork":
    case "/api/enhance-publication-artwork/start":
      return {
        operation: "enhancement",
        model: "gpt-5.6",
      };

    default:
      return null;
  }
}
