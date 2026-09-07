"use client";

import { motion } from "motion/react";

const ASPECT_CLASS = {
  wide: "aspect-[16/10]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  tall: "aspect-[4/5]",
} as const;

export type PhotoAspect = keyof typeof ASPECT_CLASS;

export default function PhotoPlaceholder({
  caption,
  aspect = "wide",
  accentColor = "#8a8878",
  className = "",
}: {
  caption: string;
  aspect?: PhotoAspect;
  accentColor?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex ${ASPECT_CLASS[aspect]} w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed p-4 text-center transition-colors ${className}`}
      style={{ borderColor: `${accentColor}55`, backgroundColor: `${accentColor}0d` }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: `${accentColor}12` }}
      />
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative flex-none opacity-70"
      >
        <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
        <circle cx="8.5" cy="10" r="1.75" />
        <path d="M21.5 15.5L16 10.5C15.4 10 14.6 10 14 10.5L6 17" />
      </svg>
      <p
        className="relative max-w-[85%] font-mono text-[11px] leading-snug tracking-wide uppercase opacity-80"
        style={{ color: accentColor }}
      >
        {caption}
      </p>
    </motion.div>
  );
}
