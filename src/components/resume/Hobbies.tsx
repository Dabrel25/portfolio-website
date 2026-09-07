"use client";

import { motion } from "motion/react";
import Section from "./Section";
import NodePhoto from "./NodePhoto";
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
                  track's WIDTH each side gets, not just which side it's on. */}
              <div className={reverse ? "sm:col-start-2" : "sm:col-start-1"}>
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
                className={`grid content-start items-start gap-3 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"} ${
                  reverse ? "sm:col-start-1" : "sm:col-start-2"
                }`}
              >
                {(images.length > 0 ? images : [undefined]).map((src, idx) => (
                  <NodePhoto
                    key={idx}
                    src={src}
                    caption={`Add photo: ${hobby.label}${images.length > 1 ? ` ${idx + 1}` : ""}`}
                    aspect="portrait"
                    accentColor={ACCENT}
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
