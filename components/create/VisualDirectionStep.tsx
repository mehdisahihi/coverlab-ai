"use client";

type VisualDirectionStepProps = {
  style: string;
  setStyle: (value: string) => void;
  emphasis: string;
  setEmphasis: (value: string) => void;
  mood: string;
  setMood: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function VisualDirectionStep({
  style,
  setStyle,
  emphasis,
  setEmphasis,
  mood,
  setMood,
  notes,
  setNotes,
  onBack,
  onContinue,
}: VisualDirectionStepProps) {
  const styles = [
    {
      id: "Scientific 3D",
      title: "Scientific 3D",
      text: "Detailed molecular and material visualization with realistic depth.",
    },
    {
      id: "Cinematic",
      title: "Cinematic",
      text: "Dramatic lighting, atmosphere and high-impact visual storytelling.",
    },
    {
      id: "Minimal",
      title: "Minimal",
      text: "Clean composition with strong hierarchy and reduced visual complexity.",
    },
    {
      id: "Editorial",
      title: "Editorial",
      text: "Polished scientific illustration inspired by journal cover artwork.",
    },
    {
      id: "Futuristic",
      title: "Futuristic",
      text: "High-tech visual language with luminous and abstract scientific elements.",
    },
    {
      id: "Custom",
      title: "Custom",
      text: "Describe your own artistic direction.",
    },
  ];

  return (
    <section className="max-w-4xl">
      <p className="text-sm font-medium text-cyan-300">STEP 4 OF 5</p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Choose the visual direction
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        You&apos;re not writing a prompt. You&apos;re directing the artwork.
        Choose the style, scientific emphasis and overall visual mood.
      </p>

      <div className="mt-10 space-y-10">
        <div>
          <label className="mb-4 block text-sm font-medium">
            Visual style
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            {styles.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStyle(item.id)}
                className={`rounded-2xl border p-5 text-left transition ${
                  style === item.id
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            What should the artwork emphasize?
          </label>

          <div className="flex flex-wrap gap-3">
            {[
              "Main discovery",
              "Molecular mechanism",
              "Material interaction",
              "Structure",
              "Transformation",
              "Comparison",
              "Application",
              "Custom",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEmphasis(item)}
                className={`rounded-full border px-4 py-2.5 text-sm transition ${
                  emphasis === item
                    ? "border-violet-400 bg-violet-400/10 text-white"
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            Visual mood
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Clean & precise",
              "Bold & dramatic",
              "Elegant & refined",
              "Dark & cinematic",
              "Bright & optimistic",
              "Neutral scientific",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMood(item)}
                className={`rounded-xl border p-4 text-sm transition ${
                  mood === item
                    ? "border-cyan-400 bg-cyan-400/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Additional direction
            <span className="ml-2 font-normal text-slate-500">
              Optional
            </span>
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Example: Keep the protein scientifically recognizable, make the ligand the focal point, use a dark background and avoid excessive text."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 leading-7 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <p className="text-sm font-medium text-white">
            Your current direction
          </p>

          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-slate-500">Style</p>
              <p className="mt-1 text-slate-200">{style || "Not selected"}</p>
            </div>

            <div>
              <p className="text-slate-500">Emphasis</p>
              <p className="mt-1 text-slate-200">
                {emphasis || "Not selected"}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Mood</p>
              <p className="mt-1 text-slate-200">{mood || "Not selected"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={onBack}
            className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
          >
            ← Back
          </button>

          <button
            onClick={onContinue}
            disabled={!style || !emphasis || !mood}
            className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition enabled:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Generate concepts →
          </button>
        </div>
      </div>
    </section>
  );
}