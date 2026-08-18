type JournalStepProps = {
  publisher: string;
  setPublisher: (value: string) => void;
  journal: string;
  setJournal: (value: string) => void;
  artworkType: string;
  setArtworkType: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function JournalStep({
  publisher,
  setPublisher,
  journal,
  setJournal,
  artworkType,
  setArtworkType,
  onBack,
  onContinue,
}: JournalStepProps) {
  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-300">STEP 2 OF 5</p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Where is your artwork going?
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Tell us the target publication so we can prepare your artwork for the
        right scientific context and, later, check relevant submission
        requirements.
      </p>

      <div className="mt-10 space-y-7">
        <div>
          <label className="mb-2 block text-sm font-medium">Publisher</label>

          <select
            value={publisher}
            onChange={(e) => {
              setPublisher(e.target.value);
              setJournal("");
            }}
            className="w-full rounded-xl border border-white/10 bg-[#0d121c] px-4 py-4 outline-none focus:border-cyan-400/60"
          >
            <option value="">Select publisher</option>
            <option value="ACS">American Chemical Society (ACS)</option>
            <option value="RSC">Royal Society of Chemistry (RSC)</option>
            <option value="Wiley">Wiley</option>
            <option value="Elsevier">Elsevier</option>
            <option value="Springer Nature">Springer Nature</option>
            <option value="Other">Other / Not sure</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Journal
          </label>

          <input
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="e.g. Langmuir, ACS Nano, Advanced Materials..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Start typing the journal name. Automatic journal lookup will be
            added in a later version.
          </p>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            Artwork type
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Front Cover",
              "Back Cover",
              "Inside Cover",
              "Supplementary Cover",
              "Graphical Abstract",
              "Other",
            ].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setArtworkType(type)}
                className={`rounded-xl border p-4 text-left transition ${
                  artworkType === type
                    ? "border-cyan-400 bg-cyan-400/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5">
          <p className="text-sm font-medium text-cyan-200">
            Journal-aware artwork
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            CoverLab will eventually use the selected publication to help
            check dimensions, resolution, layout constraints and relevant
            artwork policies before final export.
          </p>
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
            disabled={!publisher || !journal.trim() || !artworkType}
            className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition enabled:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continue to assets →
          </button>
        </div>
      </div>
    </section>
  );
}