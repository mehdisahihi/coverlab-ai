"use client";

import { useState } from "react";

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
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-semibold tracking-tight">
            CoverLab<span className="text-cyan-400">AI</span>
          </a>

          <div className="text-sm text-slate-400">
            Create scientific cover
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