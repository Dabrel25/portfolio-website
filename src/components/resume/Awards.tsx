"use client";

import { motion } from "motion/react";
import Section from "./Section";
import { awards } from "@/data/resume";

const ACCENT = "#d6b545";

export default function Awards() {
  return (
    <Section id="awards" title="Awards" eyebrow="Recognition" accentColor={ACCENT}>
      <ul className="space-y-4">
        {awards.map((award) => (
          <motion.li
            key={award.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="flex items-start gap-4 rounded-2xl border p-5"
            style={{ borderColor: `${ACCENT}35`, backgroundColor: `${ACCENT}0d` }}
          >
            <span className="mt-0.5 flex-none text-2xl" aria-hidden>
              🏆
            </span>
            <div>
              <p className="text-sm font-bold text-[#1f1e1b]">{award.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#4a493f]">{award.detail}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </Section>
  );
}
