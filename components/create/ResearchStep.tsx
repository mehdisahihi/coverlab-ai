type ResearchStepProps = {
  title: string;
  setTitle: (value: string) => void;
  abstract: string;
  setAbstract: (value: string) => void;
  keywords: string;
  setKeywords: (value: string) => void;
  onContinue: () => void;
};

export default function ResearchStep({
  title,
  setTitle,
  abstract,
  setAbstract,
  keywords,
  setKeywords,
  onContinue,
}: ResearchStepProps) {
  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-300">STEP 1 OF 5</p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Tell us about your research
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        We&apos;ll use this information to understand the scientific story
        behind your work before creating any artwork.
      </p>

      <div className="mt-10 space-y-7">
        <div>
          <label className="mb-2 block text-sm font-medium">Paper title</label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter the title of your research..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="text-sm font-medium">Abstract</label>

            <span className="text-xs text-slate-500">
              {abstract.length} characters
            </span>
          </div>

          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Paste your abstract here..."
            rows={10}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 leading-7 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Keywords
            <span className="ml-2 font-normal text-slate-500">Optional</span>
          </label>

          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. molecular dynamics, protein-ligand, nanomaterials"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <p className="text-sm font-medium">🔒 Your research remains private</p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your research content is used only to create your artwork.
            Privacy and data-handling controls will be shown before AI
            processing.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onContinue}
            disabled={!title.trim() || !abstract.trim()}
            className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition enabled:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continue to journal →
          </button>
        </div>
      </div>
    </section>
  );
}