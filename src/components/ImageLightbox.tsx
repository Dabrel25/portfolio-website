"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Full-screen image popup. Rendered through a portal to <body> so it can't
 * be trapped/offset by transformed ancestors (the detail card and chat dock
 * both animate with transforms). Click anywhere or press Escape to close. */
export default function ImageLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full-size image"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- data-driven, non-static image set */}
      <img src={src} alt="" className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-5 text-3xl leading-none text-white/80 hover:text-white"
      >
        ×
      </button>
    </div>,
    document.body
  );
}
