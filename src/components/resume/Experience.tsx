"use client";

import { motion } from "motion/react";
import Section from "./Section";
import NodePhoto from "./NodePhoto";
import { experience } from "@/data/resume";
import { professionalOverrides } from "@/data/graph-content";

const ACCENT = "#3ea66b";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function Experience() {
  return (
    <Section id="experience" title="Experience" eyebrow="Where I've worked" accentColor={ACCENT} wide>
      <div className="space-y-16">
        {experience.map((job, i) => {
          const override = professionalOverrides[`job-${slugify(job.company)}`];
          const highlights = override?.highlights ?? job.highlights;
          const image = override?.images?.[0] ?? job.images?.[0];
          const reverse = i % 2 === 1;

          return (
            <motion.div
              key={job.company}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              // Flipping just the `order` of text/photo (as this used to)
              // is wrong on its own: this grid's columns are asymmetric
              // (1fr/260px), and Grid auto-places order-1 into column 1 —
              // so reversing order alone would put the text into the narrow
              // 260px column on "reverse" rows instead of just moving it to
              // the right. Flipping the column template itself alongside
              // the order keeps the text in the wide track and the photo in
              // the narrow track on both sides — verified in-browser below.
              className={`grid gap-8 sm:items-start ${
                reverse ? "sm:grid-cols-[260px_1fr]" : "sm:grid-cols-[1fr_260px]"
              }`}
            >
              <div className={reverse ? "sm:order-2" : "sm:order-1"}>
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                  <h3 className="text-xl font-bold text-[#1f1e1b]">
                    {job.role} <span className="font-normal text-[#8a8878]">· {job.company}</span>
                  </h3>
                  <span
                    className="flex-none rounded-full px-2.5 py-0.5 font-mono text-xs font-medium"
                    style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                  >
                    {job.dates}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm text-[#8a8878]">{job.location}</p>
                <ul className="mt-5 space-y-3">
                  {highlights.map((point, idx) => (
                    <li key={idx} className="flex gap-3 text-sm leading-relaxed text-[#4a493f]">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                        style={{ backgroundColor: ACCENT }}
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={reverse ? "sm:order-1" : "sm:order-2"}>
                <NodePhoto src={image} caption={`Add photo: ${job.company}`} aspect="tall" accentColor={ACCENT} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
