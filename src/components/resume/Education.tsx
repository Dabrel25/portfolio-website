"use client";

import { motion } from "motion/react";
import Section from "./Section";
import NodePhoto from "./NodePhoto";
import { education } from "@/data/resume";
import { professionalOverrides } from "@/data/graph-content";

const ACCENT = "#3ea66b";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function Education() {
  return (
    <Section id="education" title="Education" eyebrow="Where I studied" accentColor={ACCENT}>
      <div className="space-y-10">
        {education.map((entry) => {
          const override = professionalOverrides[`education-${slugify(entry.school)}`];
          const program = (override?.meta?.program as string | undefined) ?? entry.program;
          const detail = override?.description ?? entry.detail;
          const image = override?.images?.[0];

          return (
            <motion.div
              key={entry.school}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="flex gap-5 rounded-2xl border bg-white/60 p-6"
              style={{ borderColor: `${ACCENT}30` }}
            >
              <div className="w-24 flex-none sm:w-32">
                <NodePhoto src={image} caption={`Add photo: ${entry.school}`} aspect="square" accentColor={ACCENT} />
              </div>
              <div className="flex-1">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                  <h3 className="text-lg font-bold text-[#1f1e1b]">{entry.school}</h3>
                  <span
                    className="flex-none rounded-full px-2.5 py-0.5 font-mono text-xs font-medium"
                    style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                  >
                    {entry.dates}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm text-[#8a8878]">
                  {program} · {entry.location}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#4a493f]">{detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
