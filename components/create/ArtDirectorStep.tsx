"use client";

type Concept = {
  title: string;
  idea: string;
  scientific_elements: string[];
  artistic_elements: string[];
  composition: string;
  caution: string;
};

type ArtDirectorStepProps = {
  concept: Concept;
  realism: string;
  setRealism: (value: string) => void;
  freedom: string;
  setFreedom: (value: string) => void;
  composition: string;
  setComposition: (value: string) => void;
  colorDirection: string;
  setColorDirection: (value: string) => void;
  preserveAssets: boolean;
  setPreserveAssets: (value: boolean) => void;
  extraNotes: string;
  setExtraNotes: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function ArtDirectorStep({
  concept,
  realism,
  setRealism,
  freedom,
  setFreedom,
  composition,
  setComposition,
  colorDirection,
  setColorDirection,
  preserveAssets,
  setPreserveAssets,
  extraNotes,
  setExtraNotes,
  onBack,
  onContinue,
}: ArtDirectorStepProps) {
  return (
    <section className="max-w-5xl">
      <p className="text-sm font-medium text-cyan-300">
        ART DIRECTION
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Develop this concept
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Fine-tune how this scientific concept should be translated into
        a journal-cover image.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Selected concept */}
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Selected concept
          </p>

          <h2 className="mt-4 text-2xl font-medium">
            {concept.title}
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            {concept.idea}
          </p>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Composition
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {concept.composition}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-amber-300/10 bg-amber-300/[0.03] p-4">
            <p className="text-xs uppercase tracking-widest text-amber-200/70">
              Scientific caution
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {concept.caution}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-7">
          <ControlGroup
            label="Scientific realism"
            value={realism}
            setValue={setRealism}
            options={[
              "Strictly scientific",
              "Balanced",
              "Visually expressive",
            ]}
          />

          <ControlGroup
            label="Artistic freedom"
            value={freedom}
            setValue={setFreedom}
            options={[
              "Low",
              "Medium",
              "High",
            ]}
          />

          <ControlGroup
            label="Composition style"
            value={composition}
            setValue={setComposition}
            options={[
              "Close-up",
              "Wide scene",
              "Central focal point",
              "Diagonal dynamic",
              "Layered depth",
            ]}
          />

          <ControlGroup
            label="Color direction"
            value={colorDirection}
            setValue={setColorDirection}
            options={[
              "Dark cinematic",
              "Cool scientific",
              "Warm dramatic",
              "Minimal neutral",
              "Custom",
            ]}
          />

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={preserveAssets}
                onChange={(e) => setPreserveAssets(e.target.checked)}
                className="mt-1"
              />

              <div>
                <p className="font-medium text-white">
                  Preserve uploaded scientific assets
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Keep uploaded molecular structures, figures or simulation
                  snapshots scientifically recognizable in the final artwork.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Additional art direction
            </label>

            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              rows={5}
              placeholder="Example: keep the protein orientation accurate, make the interfacial water visible, avoid excessive glowing effects..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 leading-7 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm hover:bg-white/5"
        >
          ← Back to concepts
        </button>

        <button
          onClick={onContinue}
          disabled={!realism || !freedom || !composition || !colorDirection}
          className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition enabled:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Build production brief →
        </button>
      </div>
    </section>
  );
}

function ControlGroup({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{label}</p>

      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setValue(option)}
            className={`rounded-full border px-4 py-2.5 text-sm transition ${
              value === option
                ? "border-cyan-400 bg-cyan-400/10 text-white"
                : "border-white/10 text-slate-400 hover:border-white/20"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}