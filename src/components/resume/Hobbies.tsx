"use client";

import { motion } from "motion/react";
import Section from "./Section";
import NodePhoto, { PHOTO_HEIGHT_CAPS } from "./NodePhoto";
import { hobbyNodes } from "@/data/graph-content";

const ACCENT = "#4bb3a0";

export default function Hobbies() {
  return (
    <Section id="hobbies" title="Hobbies" eyebrow="Outside of work" accentColor={ACCENT} wide>
      <div className="space-y-20">
        {hobbyNodes.map((hobby, i) => {
          const favorites = hobby.meta?.favorites;
          const favoritesList = Array.isArray(favorites) ? favorites : undefined;
          const images = hobby.images ?? [];
          const reverse = i % 2 === 1;

          return (
            <motion.div
              key={hobby.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
              className="grid gap-8 sm:grid-cols-[1.3fr_1fr] sm:items-center"
            >
              {/* Explicit grid-column placement, not `order` — this grid's
                  tracks are asymmetric (1.3fr / 1fr), and CSS Grid auto-
                  places items by order-modified document order, so
                  reversing visual position via `order` would swap which
                  track's WIDTH each side gets, not just which side it's on.
                  row-start-1 on both is also required: on a `reverse` row
                  the text (col-start-2) appears first in DOM order and the
                  photo grid (col-start-1) second — auto-placement's cursor
                  advances to column 2 for the first item, then the second
                  item's column-1 request is "behind" that cursor, so Grid
                  silently wraps it to a new implicit row instead of sharing
                  row 1, leaving the photo grid stranded far below the text. */}
              <div className={`sm:row-start-1 ${reverse ? "sm:col-start-2" : "sm:col-start-1"}`}>
                <h3 className="text-2xl font-bold text-[#1f1e1b]">{hobby.label}</h3>
                <p className="mt-4 font-serif text-xl leading-relaxed text-[#4a493f] italic">
                  &ldquo;{hobby.description?.split(". ")[0]}.&rdquo;
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-[#4a493f]">
                  {hobby.description?.split(". ").slice(1).join(". ")}
                </p>
                {favoritesList && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {favoritesList.map((fav) => (
                      <span
                        key={fav}
                        className="rounded-full px-3 py-1 font-mono text-xs"
                        style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                      >
                        {fav}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={`grid content-start items-start gap-3 sm:row-start-1 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"} ${
                  reverse ? "sm:col-start-1" : "sm:col-start-2"
                }`}
              >
                {/* Tighter height caps than the standalone 420px default:
                    these photos sit beside a two-or-three-line text column,
                    and at full height a portrait shot or a 2x2 logo grid
                    runs about twice as tall as that text — the row takes the
                    photo's height and strands a large blank block next to
                    the words. Scaling down (still object-contain) closes the
                    gap without cropping, which matters because several of
                    these are logos that lose their wordmark the moment they
                    get cropped. A grid cell gets the looser cap since it's
                    only half the column wide to begin with. */}
                {(images.length > 0 ? images : [undefined]).map((src, idx) => (
                  <NodePhoto
                    key={idx}
                    src={src}
                    caption={`Add photo: ${hobby.label}${images.length > 1 ? ` ${idx + 1}` : ""}`}
                    aspect="portrait"
                    accentColor={ACCENT}
                    maxHeightClass={images.length > 1 ? PHOTO_HEIGHT_CAPS.grid : PHOTO_HEIGHT_CAPS.compact}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
