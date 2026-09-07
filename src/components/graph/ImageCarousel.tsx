"use client";

import { useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";

const ASPECT_CLASSES = {
  square: "aspect-square",
  video: "aspect-video",
  ultrawide: "aspect-[21/9]",
} as const;

export default function ImageCarousel({
  images,
  aspect = "video",
}: {
  images: string[];
  aspect?: keyof typeof ASPECT_CLASSES;
}) {
  const [index, setIndex] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (images.length === 0) return null;

  const go = (delta: number) => {
    setIndex((current) => (current + delta + images.length) % images.length);
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-[#f0eee5] ${ASPECT_CLASSES[aspect]}`}>
      {/* The photo set mixes portraits, squares, and wide banners, so a fixed-
          aspect object-cover crop butchers most of them. Instead the full
          image is object-contain'd (never cropped), and a blurred, oversized
          copy of the same image fills whatever the contain fit leaves empty —
          reads as a deliberate frame rather than letterbox bars, at every
          aspect ratio. */}
      <button
        type="button"
        onClick={() => setLightboxSrc(images[index])}
        aria-label="View full-size image"
        className="relative block h-full w-full cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- data-driven, non-static image set */}
        <img
          src={images[index]}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-lg"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- data-driven, non-static image set */}
        <img src={images[index]} alt="" className="relative h-full w-full object-contain" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#4a493f] shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#4a493f] shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((image, i) => (
              <button
                key={image}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
