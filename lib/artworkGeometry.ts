export type ArtworkGeometry = {
  key: "cover" | "graphical-abstract" | "toc";

  label: string;

  generationSize:
    | "1024x1536"
    | "1536x1024";

  orientation:
    | "portrait"
    | "landscape";

  targetAspectRatio: number;

  compositionInstruction: string;
};

export function getArtworkGeometry(
  artworkType: string
): ArtworkGeometry {
  const normalized =
    artworkType.toLowerCase();

  if (
    normalized.includes("graphical")
  ) {
    return {
      key: "graphical-abstract",

      label: "Graphical Abstract",

      generationSize:
        "1536x1024",

      orientation:
        "landscape",

      targetAspectRatio: 2.5,

      compositionInstruction: `
Design this specifically as a wide scientific graphical abstract.

The final publication layout will be substantially wider than it is tall.

COMPOSITION RULES:

- Build the scientific story horizontally from left to right.
- Use a strong wide composition rather than a journal-cover composition.
- Keep all scientifically essential content inside the central horizontal band.
- Avoid important elements near the extreme top and bottom edges.
- Prefer 2–4 visually connected scientific stages or zones when appropriate.
- Make the central scientific message understandable at relatively small display size.
- Avoid a dominant vertical hero-object composition.
- Do not reserve masthead space.
- Do not add article title, authors, journal logo or decorative typography.
- Leave enough visual breathing room so the image can later be cropped to approximately 2.5:1 without losing essential scientific content.
`,
    };
  }

  if (
    normalized.includes("toc") ||
    normalized.includes(
      "table of contents"
    )
  ) {
    return {
      key: "toc",

      label: "TOC Graphic",

      generationSize:
        "1536x1024",

      orientation:
        "landscape",

      targetAspectRatio: 2,

      compositionInstruction: `
Design this specifically as a compact wide Table-of-Contents scientific graphic.

COMPOSITION RULES:

- Use a horizontal approximately 2:1 conceptual composition.
- Communicate one primary scientific idea quickly.
- Keep the scientific focal point near the center.
- Use fewer visual elements than a full journal cover.
- Avoid excessive background scenery.
- Keep important elements away from the top and bottom edges.
- Do not reserve space for a journal masthead.
- Do not add article title, authors, labels or decorative typography unless scientifically indispensable.
- The image must remain understandable when displayed as a relatively small TOC thumbnail.
`,
    };
  }

  return {
    key: "cover",

    label: "Journal Cover",

    generationSize:
      "1024x1536",

    orientation:
      "portrait",

    targetAspectRatio: 0.819,

    compositionInstruction: `
Design this specifically as a vertical scientific journal-cover artwork.

COMPOSITION RULES:

- Use a strong portrait composition.
- Establish one memorable primary focal point.
- Build depth from foreground through background where appropriate.
- Preserve useful negative space near the upper portion for a journal masthead.
- Do not place critical scientific information at the extreme top.
- The composition should feel editorial, premium and visually striking from a distance.
- Avoid the visual language of a graphical abstract or scientific poster.
- Do not add the journal masthead, article title, authors or decorative typography.
`,
  };
}