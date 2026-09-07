"use client";

import { motion } from "motion/react";
import Section from "./Section";
import { skills } from "@/data/resume";

const ACCENT = "#5b8def";

const EXTRA_GROUPS: { category: string; items: string[] }[] = [
  { category: "Product & Strategy", items: ["Product architecting", "Strategic thinking", "Analytical reasoning", "Intellectual curiosity", "Cross-functional collaboration"] },
];

const AUGMENTED: Record<string, string[]> = {
  "AI / ML": ["Neo4j", "LangChain"],
  "Cloud & Data": ["AWS Console", "Data modelling"],
};

// Rotates through the graph's own category palette so the skill groups
// read as color-coded clusters rather than one flat blue everywhere.
const GROUP_COLORS = ["#5b8def", "#3ea66b", "#e08a3e", "#9b6bd6", "#4bb3a0", "#d6b545"];

export default function Skills() {
  const groups = [
    ...skills.map((group) => ({ ...group, items: [...group.items, ...(AUGMENTED[group.category] ?? [])] })),
    ...EXTRA_GROUPS,
  ];

  return (
    <Section id="skills" title="Technical Skills" eyebrow="What I work with" accentColor={ACCENT}>
      <div className="grid items-start gap-8 sm:grid-cols-2">
        {groups.map((group, i) => {
          const color = GROUP_COLORS[i % GROUP_COLORS.length];
          return (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.05 }}
            >
              <h3 className="flex items-center gap-2 font-mono text-sm font-semibold text-[#1f1e1b]">
                <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: color }} />
                {group.category}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border px-3 py-1 font-mono text-xs text-[#4a493f] transition-colors hover:text-[#1f1e1b]"
                    style={{ borderColor: `${color}40`, backgroundColor: `${color}0d` }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
