"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  findExactProfile,
} from "../../lib/publicationRegistry";

export type PublicationCropSelection = {
  approved: boolean;

  sourceWidth: number;
  sourceHeight: number;

  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;

  targetWidth: number;
  targetHeight: number;
  targetDpi: number;

  positionX: number;
  positionY: number;
};

type PublicationCropPreviewProps = {
  image: string;

  publisher: string;
  journal: string;
  artworkType: string;

  onCropChange?: (
    selection: PublicationCropSelection | null
  ) => void;
};

type ImageDimensions = {
  width: number;
  height: number;
};

export default function PublicationCropPreview({
  image,
  publisher,
  journal,
  artworkType,
  onCropChange,
}: PublicationCropPreviewProps) {
  const [dimensions, setDimensions] =
    useState<ImageDimensions>({
      width: 0,
      height: 0,
    });

  const [positionX, setPositionX] =
    useState(50);

  const [positionY, setPositionY] =
    useState(50);

  const [approved, setApproved] =
    useState(false);

  const profile =
    findExactProfile(
      publisher,
      journal,
      artworkType
    );

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.src = image;
  }, [image]);

  /*
    Changing the artwork or publication target
    invalidates the previous approval.
  */
  useEffect(() => {
    setApproved(false);
    setPositionX(50);
    setPositionY(50);

    onCropChange?.(null);
  }, [
    image,
    publisher,
    journal,
    artworkType,
  ]);

  const crop = useMemo(() => {
    if (
      !profile ||
      !dimensions.width ||
      !dimensions.height
    ) {
      return null;
    }

    const sourceWidth =
      dimensions.width;

    const sourceHeight =
      dimensions.height;

    const sourceRatio =
      sourceWidth /
      sourceHeight;

    const targetRatio =
      profile.widthPx /
      profile.heightPx;

    let cropX = 0;
    let cropY = 0;

    let cropWidth =
      sourceWidth;

    let cropHeight =
      sourceHeight;

    let cropAxis:
      | "horizontal"
      | "vertical"
      | "none" =
      "none";

    /*
      Source is wider than target:
      crop left/right.
    */
    if (
      sourceRatio >
      targetRatio
    ) {
      cropAxis =
        "horizontal";

      cropWidth =
        sourceHeight *
        targetRatio;

      const availableX =
        sourceWidth -
        cropWidth;

      cropX =
        availableX *
        (positionX / 100);
    }

    /*
      Source is taller than target:
      crop top/bottom.
    */
    if (
      sourceRatio <
      targetRatio
    ) {
      cropAxis =
        "vertical";

      cropHeight =
        sourceWidth /
        targetRatio;

      const availableY =
        sourceHeight -
        cropHeight;

      cropY =
        availableY *
        (positionY / 100);
    }

    return {
      sourceWidth,
      sourceHeight,

      cropX,
      cropY,
      cropWidth,
      cropHeight,

      cropAxis,

      targetRatio,

      retainedWidthPercent:
        (cropWidth /
          sourceWidth) *
        100,

      retainedHeightPercent:
        (cropHeight /
          sourceHeight) *
        100,

      leftPercent:
        (cropX /
          sourceWidth) *
        100,

      topPercent:
        (cropY /
          sourceHeight) *
        100,
    };
  }, [
    profile,
    dimensions,
    positionX,
    positionY,
  ]);

  /*
    Continuously send the current crop geometry
    to the parent component.

    Approval remains a separate explicit action.
  */
  useEffect(() => {
    if (
      !profile ||
      !crop
    ) {
      onCropChange?.(null);
      return;
    }

    onCropChange?.({
      approved,

      sourceWidth:
        crop.sourceWidth,

      sourceHeight:
        crop.sourceHeight,

      cropX:
        crop.cropX,

      cropY:
        crop.cropY,

      cropWidth:
        crop.cropWidth,

      cropHeight:
        crop.cropHeight,

      targetWidth:
        profile.widthPx,

      targetHeight:
        profile.heightPx,

      targetDpi:
        profile.dpi,

      positionX,
      positionY,
    });
  }, [
    approved,
    crop,
    profile,
    positionX,
    positionY,
  ]);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-300">
          Publication crop
        </p>

        <h2 className="mt-3 text-xl font-medium">
          Exact crop unavailable
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          CoverLab does not yet have a
          verified exact-size profile for
          this journal and artwork type.
          The image will not be cropped
          automatically.
        </p>
      </div>
    );
  }

  if (
    !crop ||
    !dimensions.width ||
    !dimensions.height
  ) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-slate-400">
          Preparing publication crop
          preview...
        </p>
      </div>
    );
  }

  const mastheadPercent =
    profile.mastheadSafeAreaPx
      ? Math.min(
          100,
          (profile.mastheadSafeAreaPx /
            profile.heightPx) *
            100
        )
      : 0;

  const cropNeeded =
    crop.cropAxis !==
    "none";

  function invalidateApproval() {
    setApproved(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
            Publication crop preview
          </p>

          <h2 className="mt-3 text-xl font-medium">
            Approve the final framing
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            The bright rectangle shows
            exactly which part of the
            selected artwork will be used
            for the publication-sized
            export.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-xs text-slate-500">
            Target
          </p>

          <p className="mt-1 text-sm text-slate-200">
            {profile.widthPx} ×{" "}
            {profile.heightPx} px
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {profile.dpi} dpi
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-7 flex justify-center">
        <div
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black"
          style={{
            aspectRatio:
              `${dimensions.width} / ${dimensions.height}`,
          }}
        >
          {/* Full image */}
          <img
            src={image}
            alt="Publication crop preview"
            className="absolute inset-0 h-full w-full object-fill"
          />

          {/* Darken everything */}
          <div className="pointer-events-none absolute inset-0 bg-black/65" />

          {/* Crop window */}
          <div
            className="absolute overflow-hidden border-2 border-cyan-300"
            style={{
              left:
                `${crop.leftPercent}%`,

              top:
                `${crop.topPercent}%`,

              width:
                `${crop.retainedWidthPercent}%`,

              height:
                `${crop.retainedHeightPercent}%`,
            }}
          >
            {/* Re-display original image inside crop */}
            <img
              src={image}
              alt=""
              aria-hidden="true"
              className="absolute max-w-none"
              style={{
                width:
                  `${10000 / crop.retainedWidthPercent}%`,

                height:
                  `${10000 / crop.retainedHeightPercent}%`,

                left:
                  `${-(crop.leftPercent * 100) /
                  crop.retainedWidthPercent}%`,

                top:
                  `${-(crop.topPercent * 100) /
                  crop.retainedHeightPercent}%`,
              }}
            />

            {/* Masthead overlay */}
            {mastheadPercent >
              0 && (
              <div
                className="absolute left-0 right-0 top-0 border-b border-amber-300/70 bg-amber-300/20"
                style={{
                  height:
                    `${mastheadPercent}%`,
                }}
              >
                <div className="p-3">
                  <span className="rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-amber-200">
                    JOURNAL MASTHEAD
                    ZONE
                  </span>
                </div>
              </div>
            )}

            {/* Safety guide */}
            <div className="pointer-events-none absolute inset-[7%] border border-dashed border-white/25" />
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <InfoCard
          label="Source"
          value={`${dimensions.width} × ${dimensions.height}`}
        />

        <InfoCard
          label="Target"
          value={`${profile.widthPx} × ${profile.heightPx}`}
        />

        <InfoCard
          label="Crop retained"
          value={`${crop.retainedWidthPercent.toFixed(
            1
          )}% × ${crop.retainedHeightPercent.toFixed(
            1
          )}%`}
        />
      </div>

      {/* Crop controls */}
      {cropNeeded && (
        <div className="mt-7 rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm font-medium">
            Adjust crop position
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Move the crop until all
            scientifically important
            content is inside the bright
            region.
          </p>

          {crop.cropAxis ===
            "horizontal" && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Left</span>
                <span>Right</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={positionX}
                onChange={(e) => {
                  setPositionX(
                    Number(
                      e.target.value
                    )
                  );

                  invalidateApproval();
                }}
                className="mt-2 w-full"
              />
            </div>
          )}

          {crop.cropAxis ===
            "vertical" && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Top</span>
                <span>Bottom</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={positionY}
                onChange={(e) => {
                  setPositionY(
                    Number(
                      e.target.value
                    )
                  );

                  invalidateApproval();
                }}
                className="mt-2 w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Masthead warning */}
      {mastheadPercent > 0 && (
        <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
          <p className="text-sm font-medium text-amber-100">
            Masthead safety check
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            The amber region represents
            the verified journal masthead
            area. Keep essential scientific
            content outside this region.
          </p>
        </div>
      )}

      {/* Approval */}
      <label
        className={`mt-6 flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition ${
          approved
            ? "border-emerald-400/30 bg-emerald-400/[0.05]"
            : "border-white/10 bg-black/10"
        }`}
      >
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) =>
            setApproved(
              e.target.checked
            )
          }
          className="mt-1"
        />

        <div>
          <p className="text-sm font-medium text-white">
            I approve this crop
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            I have verified that no
            scientifically important
            information is unintentionally
            removed or hidden.
          </p>
        </div>
      </label>

      <div
        className={`mt-5 rounded-xl border p-4 ${
          approved
            ? "border-emerald-400/20 bg-emerald-400/[0.04]"
            : "border-amber-300/15 bg-amber-300/[0.03]"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            approved
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        >
          {approved
            ? "✓ Crop approved for publication-sized export"
            : "⚠ Crop approval required before publication-sized export"}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}