import Image from "next/image";

import {
  signOut,
} from "@/app/auth/actions";
import {
  createClient,
} from "@/lib/supabase/server";

async function isAuthenticated() {
  const configured =
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

  if (!configured) {
    return false;
  }

  const supabase =
    await createClient();

  const {
    data,
  } =
    await supabase.auth.getClaims();

  return Boolean(
    data?.claims?.sub
  );
}

export default async function Home() {
  const signedIn =
    await isAuthenticated();

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold tracking-tight">
          CoverLab<span className="text-cyan-400">AI</span>
        </div>

        <div className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#how" className="transition hover:text-white">
            How it works
          </a>
          <a href="#formats" className="transition hover:text-white">
            Artwork types
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          {signedIn && (
            <a
              href="/projects"
              className="hidden text-sm text-slate-300 transition hover:text-white sm:inline"
            >
              Projects
            </a>
          )}

          {signedIn ? (
            <form action={signOut}>
              <button className="rounded-full border border-white/20 px-5 py-2 text-sm transition hover:bg-white/10">
                Sign out
              </button>
            </form>
          ) : (
            <a
              href="/auth/login"
              className="rounded-full border border-white/20 px-5 py-2 text-sm transition hover:bg-white/10"
            >
              Sign in
            </a>
          )}
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-20 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            AI-assisted scientific publication artwork
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Turn your research into
            <span className="block bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
              clear publication artwork.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
            Create research-driven graphical abstracts and journal-cover concepts
            with AI-assisted visual direction, scientific constraints and iterative
            refinement.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/create"
              className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition hover:bg-slate-200"
            >
              Create artwork →
            </a>

            <a
              href="#formats"
              className="rounded-full border border-white/20 px-7 py-3.5 font-medium text-white transition hover:bg-white/10"
            >
              See artwork types
            </a>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
            No design experience required. Publisher and journal AI policies vary,
            so final suitability should always be verified with your target venue.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-16 bg-cyan-500/10 blur-3xl" />

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl">
            <Image
              src="/hero-cover.png"
              alt="Scientific publication artwork concept generated with CoverLab AI"
              width={1200}
              height={1500}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
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

      <section id="how" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-300">
            How it works
          </p>

          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight">
            Your research. Your direction. Your artwork.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              [
                "01",
                "Add your research context",
                "Provide your title, abstract, target journal and scientific assets.",
              ],
              [
                "02",
                "Choose the visual story",
                "CoverLab turns your research context into scientifically meaningful visual directions.",
              ],
              [
                "03",
                "Direct and refine",
                "Choose a direction and control composition, style and visual emphasis through iteration.",
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

      <section id="formats" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-widest text-violet-300">
              Artwork types
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Built for two common publication needs.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Start from the same research context, then shape the visual output for
              either concise scientific communication or editorial cover impact.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-sm font-medium text-cyan-300">Graphical Abstract</p>
              <h3 className="mt-3 text-2xl font-semibold">
                Explain the scientific story clearly.
              </h3>
              <p className="mt-4 leading-7 text-slate-400">
                Translate a paper into a focused visual summary that emphasizes the
                central mechanism, workflow, comparison or finding without replacing
                the underlying scientific judgment.
              </p>
            </article>

            <article className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.05] p-8">
              <p className="text-sm font-medium text-violet-300">Journal Cover</p>
              <h3 className="mt-3 text-2xl font-semibold">
                Develop a publication-focused visual concept.
              </h3>
              <p className="mt-4 leading-7 text-slate-400">
                Build a stronger editorial composition around the research theme while
                retaining scientific constraints and leaving final acceptance to the
                journal or publisher.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
              Launch pricing
            </div>

            <p className="mt-6 text-sm font-medium uppercase tracking-widest text-cyan-300">
              Pricing
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Project-based pricing. No subscription.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Pay for the publication artwork you need. Create it directly with
              CoverLab, or ask us to handle the scientific-to-visual production for
              you.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cyan-300">Self-service</p>
                  <h3 className="mt-3 text-2xl font-semibold">Graphical Abstract</h3>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-semibold">€99</div>
                  <div className="mt-1 text-sm text-slate-500">per project</div>
                </div>
              </div>

              <p className="mt-6 leading-7 text-slate-400">
                Build a clear scientific visual story while keeping direct control of
                concepts, composition and refinement.
              </p>

              <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                <li>Research-driven visual direction</li>
                <li>Reference assets and scientific constraints</li>
                <li>Iterative AI generation and refinement</li>
                <li>Policy-aware publication workflow</li>
              </ul>

              <a
                href="/create"
                className="mt-9 inline-flex rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-slate-200"
              >
                Explore the workflow →
              </a>
            </article>

            <article className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-cyan-400/[0.08] to-white/[0.03] p-8 md:p-10">
              <div className="absolute right-0 top-0 rounded-bl-2xl border-b border-l border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200">
                Premium publication artwork
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4 pr-0 pt-6 sm:pr-24 sm:pt-0">
                <div>
                  <p className="text-sm font-medium text-cyan-300">Self-service</p>
                  <h3 className="mt-3 text-2xl font-semibold">Journal Cover</h3>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-semibold">€149</div>
                  <div className="mt-1 text-sm text-slate-500">per project</div>
                </div>
              </div>

              <p className="mt-6 leading-7 text-slate-400">
                Develop scientifically responsible cover artwork with a strong
                editorial composition and publication-focused visual direction.
              </p>

              <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                <li>Research-driven visual storytelling</li>
                <li>Journal-cover composition and crop awareness</li>
                <li>Reference assets and scientific constraints</li>
                <li>Iterative AI generation and refinement</li>
              </ul>

              <a
                href="/create"
                className="mt-9 inline-flex rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-slate-200"
              >
                Explore the workflow →
              </a>
            </article>
          </div>

          <div className="mt-8 rounded-3xl border border-violet-400/20 bg-violet-400/[0.06] p-8 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-violet-300">
                  CoverLab-assisted production
                </p>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight">
                  Prefer us to handle the production?
                </h3>
                <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                  Send us your research context and scientific assets. We review the
                  material, develop the visual direction and handle the production
                  workflow with you instead of asking you to direct every generation
                  yourself.
                </p>
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  Assisted pricing starts from the amounts shown and may vary with
                  scientific complexity, source material and production scope. Final
                  suitability remains subject to the target journal or publisher
                  requirements.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <div className="text-sm text-slate-400">Graphical Abstract</div>
                  <div className="mt-2 text-3xl font-semibold">from €249</div>
                  <a
                    href="/assisted?service=graphical_abstract"
                    className="mt-4 inline-flex text-sm font-medium text-violet-200 transition hover:text-white"
                  >
                    Request a quote →
                  </a>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <div className="text-sm text-slate-400">Journal Cover</div>
                  <div className="mt-2 text-3xl font-semibold">from €399</div>
                  <a
                    href="/assisted?service=journal_cover"
                    className="mt-4 inline-flex text-sm font-medium text-violet-200 transition hover:text-white"
                  >
                    Request a quote →
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-500">
              Requesting a quote is free. We review the scope and confirm the final
              price before any payment.
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-medium text-slate-300">CoverLabAI</span> — scientific
            publication artwork workflows.
          </p>
          <p>
            AI use and final artwork suitability remain subject to publisher and
            journal requirements.
          </p>
        </div>
      </footer>
    </main>
  );
}
