"use client";

import { useRef } from "react";

type AssetsStepProps = {
  files: File[];
  setFiles: (files: File[]) => void;
  notes: string;
  setNotes: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function AssetsStep({
  files,
  setFiles,
  notes,
  setNotes,
  onBack,
  onContinue,
}: AssetsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    setFiles([...files, ...newFiles]);
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-300">STEP 3 OF 5</p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Add your scientific assets
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Add the scientific material you want the final artwork to respect or
        reference. These can include figures, molecular structures, simulation
        snapshots, microscopy images or other visual assets.
      </p>

      <div className="mt-10 space-y-7">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.svg,.tif,.tiff,.pdb,.gro,.mol,.mol2,.sdf,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.025] px-6 py-10 text-center transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.03]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xl">
            +
          </div>

          <p className="mt-4 font-medium">
            Add figures or scientific files
          </p>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Images, PDF figures, PDB/GRO structures, molecular files and
            simulation snapshots.
          </p>
        </button>

        {files.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Added files ({files.length})
            </p>

            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-4 text-sm text-slate-500 transition hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Instructions for these assets
            <span className="ml-2 font-normal text-slate-500">
              Optional
            </span>
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Example: Preserve the actual protein structure. Use Figure 3 only as scientific reference. Emphasize the ligand-binding region."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 leading-7 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />
        </div>

        <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.03] p-5">
          <p className="text-sm font-medium text-amber-100">
            Scientific asset control
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            In the full version, you&apos;ll be able to mark assets as
            scientifically locked so the artwork can change around them
            without altering the protected scientific content.
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
            className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition hover:bg-slate-200"
          >
            Continue to visual direction →
          </button>
        </div>
      </div>
    </section>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}