export default function Home() {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold tracking-tight">
          CoverLab<span className="text-cyan-400">AI</span>
        </div>

        <div className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#how">How it works</a>
          <a href="#examples">Examples</a>
          <a href="#pricing">Pricing</a>
        </div>

        <button className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10">
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-20 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            AI-powered scientific cover design
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Turn your research into
            <span className="block bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
              remarkable cover art.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
            Upload your research, choose the scientific story you want to tell,
            and direct AI to create journal-ready scientific artwork.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/create"
              className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition hover:bg-slate-200"
            >
              Create your cover →
            </a>

            <a
              href="#examples"
              className="rounded-full border border-white/20 px-7 py-3.5 font-medium text-white transition hover:bg-white/10"
            >
              View examples
            </a>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            No design experience required.
          </p>
        </div>

<div className="relative">
  <div className="absolute -inset-16 bg-cyan-500/10 blur-3xl" />

  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl">
    <img
      src="/hero-cover.png"
      alt="AI-generated scientific cover concept"
      className="aspect-[4/5] w-full rounded-2xl object-cover"
    />

    <div className="absolute bottom-7 left-7 rounded-xl border border-cyan-400/30 bg-black/60 px-4 py-3 backdrop-blur-md">
      <p className="text-sm font-medium text-white">AI-generated concept</p>
      <p className="mt-1 text-xs text-slate-300">
        Scientific direction preserved
      </p>
    </div>
  </div>
</div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-300">
            How it works
          </p>

          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight">
            Your research. Your direction. Your cover.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              [
                "01",
                "Tell us about your research",
                "Add your title, abstract, target journal and scientific assets.",
              ],
              [
                "02",
                "Choose your visual story",
                "Our AI turns your research into multiple scientifically meaningful concepts.",
              ],
              [
                "03",
                "Direct & refine",
                "Choose a concept and control the composition, style and visual emphasis.",
              ],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"
              >
                <div className="text-sm text-cyan-300">{number}</div>
                <h3 className="mt-8 text-xl font-medium">{title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}