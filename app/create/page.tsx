"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  signOut,
} from "../auth/actions";
import ResearchStep from "../../components/create/ResearchStep";
import JournalStep from "../../components/create/JournalStep";
import AssetsStep from "../../components/create/AssetsStep";
import VisualDirectionStep from "../../components/create/VisualDirectionStep";
import ConceptsStep, {
  type AIResult,
  type Concept,
} from "../../components/create/ConceptsStep";
import ArtDirectorStep from "../../components/create/ArtDirectorStep";
import ProductionBriefStep, {
  type ProductionBrief,
} from "../../components/create/ProductionBriefStep";
import ArtworkStep from "../../components/create/ArtworkStep";
import {
  type HydratedProject,
  useProjectPersistence,
} from "../../components/create/useProjectPersistence";

export default function CreateCover() {
  const [step, setStep] = useState(1);

  // STEP 1 — Research
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");

  // STEP 2 — Journal
  const [publisher, setPublisher] = useState("");
  const [journal, setJournal] = useState("");
  const [artworkType, setArtworkType] = useState("");
  const [
    manualPolicyConfirmed,
    setManualPolicyConfirmed,
  ] = useState(false);

  // STEP 3 — Scientific assets
  const [files, setFiles] = useState<File[]>([]);
  const [assetNotes, setAssetNotes] = useState("");

  // STEP 4 — Visual direction
  const [visualStyle, setVisualStyle] = useState("");
  const [visualEmphasis, setVisualEmphasis] = useState("");
  const [visualMood, setVisualMood] = useState("");
  const [visualNotes, setVisualNotes] = useState("");

  // STEP 5 — AI concepts
  // Keeping this state here prevents a new API request
  // every time the user returns from Art Director.
  const [conceptResult, setConceptResult] = useState<AIResult | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  // STEP 6 — Art Director
  const [artRealism, setArtRealism] = useState("");
  const [artFreedom, setArtFreedom] = useState("");
  const [artComposition, setArtComposition] = useState("");
  const [artColorDirection, setArtColorDirection] = useState("");
  const [preserveAssets, setPreserveAssets] = useState(true);
  const [artNotes, setArtNotes] = useState("");
  const [productionBrief, setProductionBrief] = useState<ProductionBrief | null>(null);
  const [artworkImage, setArtworkImage] = useState<string | null>(null);

  const hydrateProject =
    useCallback(
      (saved: HydratedProject) => {
        setStep(saved.step);
        setTitle(saved.title);
        setAbstract(saved.abstract);
        setKeywords(saved.keywords);
        setPublisher(saved.publisher);
        setJournal(saved.journal);
        setArtworkType(saved.artworkType);

        setAssetNotes(
          saved.state.assetNotes
        );
        setVisualStyle(
          saved.state.visualStyle
        );
        setVisualEmphasis(
          saved.state.visualEmphasis
        );
        setVisualMood(
          saved.state.visualMood
        );
        setVisualNotes(
          saved.state.visualNotes
        );
        setConceptResult(
          saved.state.conceptResult as
            | AIResult
            | null
        );
        setSelectedConcept(
          saved.state.selectedConcept as
            | Concept
            | null
        );
        setArtRealism(
          saved.state.artRealism
        );
        setArtFreedom(
          saved.state.artFreedom
        );
        setArtComposition(
          saved.state.artComposition
        );
        setArtColorDirection(
          saved.state.artColorDirection
        );
        setPreserveAssets(
          saved.state.preserveAssets
        );
        setArtNotes(
          saved.state.artNotes
        );
        setProductionBrief(
          saved.state.productionBrief as
            | ProductionBrief
            | null
        );

        /*
         * Security / data-integrity boundary:
         *
         * - policy acknowledgement must be explicit
         *   for the current session/target,
         * - File objects cannot be reconstructed from
         *   metadata,
         * - generated image bytes belong in versioned
         *   storage, not the project JSON document.
         */
        setManualPolicyConfirmed(false);
        setFiles([]);
        setArtworkImage(null);
      },
      []
    );

  const projectSnapshot =
    useMemo(
      () => ({
        researchTitle:
          title,
        researchAbstract:
          abstract,
        researchKeywords:
          keywords,
        publisher,
        journal,
        artworkType,
        currentStep:
          step,
        state: {
          assetNotes,
          visualStyle,
          visualEmphasis,
          visualMood,
          visualNotes,
          conceptResult,
          selectedConcept,
          artRealism,
          artFreedom,
          artComposition,
          artColorDirection,
          preserveAssets,
          artNotes,
          productionBrief,
        },
      }),
      [
        title,
        abstract,
        keywords,
        publisher,
        journal,
        artworkType,
        step,
        assetNotes,
        visualStyle,
        visualEmphasis,
        visualMood,
        visualNotes,
        conceptResult,
        selectedConcept,
        artRealism,
        artFreedom,
        artComposition,
        artColorDirection,
        preserveAssets,
        artNotes,
        productionBrief,
      ]
    );

  const {
    status:
      persistenceStatus,
    error:
      persistenceError,
  } =
    useProjectPersistence({
      snapshot:
        projectSnapshot,
      onHydrate:
        hydrateProject,
    });

  const saveLabel =
    persistenceStatus ===
    "loading"
      ? "Loading project…"
      : persistenceStatus ===
          "saving"
        ? "Saving…"
        : persistenceStatus ===
            "saved"
          ? "Saved"
          : persistenceStatus ===
              "error"
            ? "Save attention"
            : "New project";

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-5">
          <a href="/" className="text-xl font-semibold tracking-tight">
            CoverLab<span className="text-cyan-400">AI</span>
          </a>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <a
              href="/projects"
              className="transition hover:text-white"
            >
              Projects
            </a>

            <span
              className={
                persistenceStatus ===
                "error"
                  ? "text-amber-300"
                  : "text-slate-500"
              }
              title={
                persistenceError ??
                undefined
              }
            >
              {saveLabel}
            </span>

            <form action={signOut}>
              <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside>
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Your project
          </p>

          <div className="space-y-6">
            <Step
              number="01"
              title="Research"
              active={step === 1}
              complete={step > 1}
            />

            <Step
              number="02"
              title="Journal"
              active={step === 2}
              complete={step > 2}
            />

            <Step
              number="03"
              title="Assets"
              active={step === 3}
              complete={step > 3}
            />

            <Step
              number="04"
              title="Visual direction"
              active={step === 4}
              complete={step > 4}
            />

            <Step
              number="05"
              title="Concepts"
              active={step === 5}
              complete={step > 5}
            />

            <Step
              number="06"
              title="Art direction"
              active={step === 6}
              complete={step > 6}
            />

            <Step
              number="07"
              title="Production brief"
              active={step === 7}
            />

            <Step
             number="08"
             title="Artwork"
             active={step === 8}
            />
          </div>
        </aside>

        {/* STEP 1 */}
        {step === 1 && (
          <ResearchStep
            title={title}
            setTitle={setTitle}
            abstract={abstract}
            setAbstract={setAbstract}
            keywords={keywords}
            setKeywords={setKeywords}
            onContinue={() => setStep(2)}
          />
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <JournalStep
            publisher={publisher}
            setPublisher={setPublisher}
            journal={journal}
            setJournal={setJournal}
            artworkType={artworkType}
            setArtworkType={setArtworkType}

            manualPolicyConfirmed={manualPolicyConfirmed}
            setManualPolicyConfirmed={setManualPolicyConfirmed}

            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
         />
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <AssetsStep
            files={files}
            setFiles={setFiles}
            notes={assetNotes}
            setNotes={setAssetNotes}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
          />
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <VisualDirectionStep
            style={visualStyle}
            setStyle={setVisualStyle}
            emphasis={visualEmphasis}
            setEmphasis={setVisualEmphasis}
            mood={visualMood}
            setMood={setVisualMood}
            notes={visualNotes}
            setNotes={setVisualNotes}
            onBack={() => setStep(3)}
            onContinue={() => setStep(5)}
          />
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <ConceptsStep
            title={title}
            abstract={abstract}
            publisher={publisher}
            journal={journal}
            artworkType={artworkType}
            style={visualStyle}
            emphasis={visualEmphasis}
            mood={visualMood}
            visualNotes={visualNotes}
            result={conceptResult}
            setResult={setConceptResult}
            onBack={() => setStep(4)}
            onDevelop={(concept) => {
              setSelectedConcept(concept);
              setStep(6);
            }}
          />
        )}

        {/* STEP 6 */}
        {step === 6 && selectedConcept && (
          <ArtDirectorStep
            concept={selectedConcept}
            realism={artRealism}
            setRealism={setArtRealism}
            freedom={artFreedom}
            setFreedom={setArtFreedom}
            composition={artComposition}
            setComposition={setArtComposition}
            colorDirection={artColorDirection}
            setColorDirection={setArtColorDirection}
            preserveAssets={preserveAssets}
            setPreserveAssets={setPreserveAssets}
            extraNotes={artNotes}
            setExtraNotes={setArtNotes}
            onBack={() => setStep(5)}
            onContinue={() => setStep(7)}
          />
        )}

        {/* STEP 7 — temporary placeholder */}
        {step === 7 && selectedConcept && (
          <ProductionBriefStep
            title={title}
            abstract={abstract}

            publisher={publisher}
            journal={journal}
            artworkType={artworkType}

            selectedConcept={selectedConcept}

            visualStyle={visualStyle}
            visualEmphasis={visualEmphasis}
            visualMood={visualMood}
            visualNotes={visualNotes}

            assetNotes={assetNotes}
            assetNames={files.map((file) => file.name)}

            realism={artRealism}
            freedom={artFreedom}
            composition={artComposition}
            colorDirection={artColorDirection}
            preserveAssets={preserveAssets}
            artNotes={artNotes}

            result={productionBrief}
            setResult={setProductionBrief}

            onBack={() => setStep(6)}
            onGenerateArtwork={() => setStep(8)}
         />
       )}

        {step === 8 && productionBrief && (
          <ArtworkStep
           brief={productionBrief}
           publisher={publisher}
           journal={journal}
           artworkType={artworkType}
           manualPolicyConfirmed={manualPolicyConfirmed}

           files={files}
           assetNotes={assetNotes}
           preserveAssets={preserveAssets}

           initialImage={artworkImage}
           setInitialImage={setArtworkImage}

           onBack={() => setStep(7)}
         />
        )}
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  active = false,
  complete = false,
}: {
  number: string;
  title: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs ${
          active
            ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
            : complete
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 text-slate-600"
        }`}
      >
        {complete ? "✓" : number}
      </div>

      <span
        className={
          active
            ? "text-white"
            : complete
              ? "text-slate-300"
              : "text-slate-500"
        }
      >
        {title}
      </span>
    </div>
  );
}
