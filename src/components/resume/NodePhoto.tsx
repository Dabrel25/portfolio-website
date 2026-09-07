"use client";

import PhotoPlaceholder, { type PhotoAspect } from "./PhotoPlaceholder";
import { usePhotoLightbox } from "./PhotoLightboxProvider";

// Real uploaded photos are a grab-bag of shapes — portrait phone photos,
// square Instagram-style shots, and wide/near-square company or school
// logos. Rather than force every one into the same fixed aspect box (which
// either crops content off or letterboxes awkwardly when the shape doesn't
// match), let the box size itself from the image's own intrinsic dimensions
// via a plain <img> (not next/image's `fill` mode, which requires a
// predetermined box). A max-height keeps a very tall/narrow image from
// blowing out the section's layout.
const MAX_HEIGHT_CLASS = "max-h-[420px]";

// Callers that sit in a side-by-side row with a text column can pass a
// tighter ceiling than the standalone 420px default. A tall portrait photo
// (or a 2x2 logo grid) otherwise runs roughly twice the height of the two
// or three lines of text beside it, and since the photo keeps its intrinsic
// aspect via object-contain, the row's height is set by the photo — leaving
// a large blank block next to the text that no alignment can close. Scaling
// the photo down (rather than cropping it, which mangles the logos these
// grids are mostly made of) is what actually closes that gap.
// `grid` is the looser cap for a multi-image grid: each cell is only half
// the column's width, so a taller ceiling still yields a photo column close
// to the text's height, while letting the logos render big enough to read.
export const PHOTO_HEIGHT_CAPS = {
  default: MAX_HEIGHT_CLASS,
  compact: "max-h-[200px]",
  grid: "max-h-[150px]",
} as const;

// graph-content.ts nodes carry either a real /photos/* path (from the user's
// own uploads) or a leftover /nodes/*.svg flat-color placeholder generated
// before real photos existed. Render the former as a real photo, and treat
// the latter exactly like "no photo yet" — falling back to the resume's own
// styled PhotoPlaceholder — since those SVGs are debug art, not content.
export default function NodePhoto({
  src,
  caption,
  aspect = "wide",
  accentColor = "#8a8878",
  className = "",
  fill = false,
  maxHeightClass = MAX_HEIGHT_CLASS,
}: {
  src: string | undefined;
  caption: string;
  aspect?: PhotoAspect;
  accentColor?: string;
  className?: string;
  // Height ceiling for the intrinsic-sizing (non-fill) path — see
  // PHOTO_HEIGHT_CAPS above for why a row-embedded photo wants a tighter
  // cap than a standalone one.
  maxHeightClass?: string;
  // Full-bleed panels (e.g. Community's card layout, where a photo grid
  // fills one whole side of a bordered card next to a text column) need
  // the OPPOSITE of the usual intrinsic-sizing behavior: the photo should
  // stretch and crop (object-cover) to fill its container, not shrink to
  // its own content height, or a short photo next to long text leaves a
  // large blank gap in the panel. Every other caller (Experience/
  // Education/Hobbies standalone photos) wants intrinsic sizing, so this
  // defaults to false and is opt-in per call site.
  fill?: boolean;
}) {
  const hasRealPhoto = !!src && !src.startsWith("/nodes/");
  const openLightbox = usePhotoLightbox();

  if (!hasRealPhoto) {
    return <PhotoPlaceholder caption={caption} aspect={aspect} accentColor={accentColor} className={className} />;
  }

  // Every call site writes its caption as a placeholder instruction ("Add
  // photo: GoTyme Bank") since that's all the caption was ever used for
  // before the lightbox existed. Once a real photo is in place, that
  // phrasing reads wrong as an actual caption/alt text — strip the prefix
  // so the lightbox and alt text show just the subject ("GoTyme Bank").
  const label = caption.replace(/^Add photo:\s*/i, "");
  const openThis = () => openLightbox({ src, caption: label });

  if (fill) {
    return (
      <button
        type="button"
        onClick={openThis}
        aria-label={`View full-size: ${label}`}
        className={`relative h-full min-h-[160px] w-full cursor-zoom-in overflow-hidden ${className}`}
        style={{ backgroundColor: `${accentColor}0d` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- see the
            plain-<img> rationale below; fill mode additionally needs
            absolute positioning to crop within a parent-controlled height,
            which next/image's `fill` prop could also do, but staying on
            plain <img> keeps this component's two modes consistent. */}
        <img src={src} alt={label} className="absolute inset-0 h-full w-full object-cover" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openThis}
      aria-label={`View full-size: ${label}`}
      className={`w-full cursor-zoom-in overflow-hidden rounded-xl ${maxHeightClass} ${className}`}
      style={{ boxShadow: `0 0 0 1px ${accentColor}30`, backgroundColor: `${accentColor}0d` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- real photos
          vary wildly in aspect ratio (portrait phone shots, square posts,
          wide logos); a plain <img> sizes itself from the file's actual
          intrinsic dimensions, which next/image's width/height contract
          can't do without hardcoding a ratio that would be wrong for most
          of these files. */}
      <img src={src} alt={label} className={`h-auto w-full object-contain ${maxHeightClass}`} />
    </button>
  );
}
