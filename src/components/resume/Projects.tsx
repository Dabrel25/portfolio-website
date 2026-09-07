"use client";

import { motion } from "motion/react";
import Section from "./Section";
import NodePhoto from "./NodePhoto";
import { projectNodes } from "@/data/graph-content";

const ACCENT = "#e08a3e";

function metaList(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

export default function Projects() {
  return (
    <Section id="projects" title="Projects" eyebrow="Things I've built" accentColor={ACCENT} wide>
      <div className="grid items-start gap-6 sm:grid-cols-6">
        {projectNodes.map((project, i) => {
          // Featured/wide cards every third slot for a staggered rhythm
          // instead of a uniform grid of identical boxes.
          const featured = i % 3 === 0;
          const stack = metaList(project.meta?.stack);
          const partners = metaList(project.meta?.partners);
          const award = project.meta?.award as string | undefined;
          const recognition = project.meta?.recognition as string | undefined;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/60 p-6 transition-shadow hover:shadow-lg ${
                featured ? "sm:col-span-4" : "sm:col-span-2"
              }`}
              style={{ borderColor: `${ACCENT}30` }}
            >
              <span
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: ACCENT }}
              />

              <div className={`flex flex-1 flex-col gap-5 ${featured ? "sm:flex-row" : ""}`}>
                <div className={featured ? "sm:w-2/5 sm:flex-none" : ""}>
                  <NodePhoto
                    src={project.images?.[0]}
                    caption={`Add photo: ${project.label}`}
                    aspect="wide"
                    accentColor={ACCENT}
                  />
                </div>

                <div className="flex flex-1 flex-col">
                  <h3 className="text-lg font-bold text-[#1f1e1b]">
                    {project.link ? (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {project.label}
                      </a>
                    ) : (
                      project.label
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4a493f]">{project.description}</p>

                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {project.highlights.map((point, idx) => (
                        <li key={idx} className="flex gap-3 text-sm leading-relaxed text-[#4a493f]">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                            style={{ backgroundColor: ACCENT }}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-5">
                    {award && (
                      <p className="mb-2 font-mono text-xs font-medium" style={{ color: "#d6b545" }}>
                        🏆 {award}
                      </p>
                    )}
                    {recognition && (
                      <p className="mb-2 font-mono text-xs font-medium" style={{ color: "#d6b545" }}>
                        🏆 {recognition}
                      </p>
                    )}
                    {partners && (
                      <p className="mb-2 font-mono text-xs text-[#8a8878]">Partners: {partners.join(", ")}</p>
                    )}
                    {stack && (
                      <div className="flex flex-wrap gap-1.5">
                        {stack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide"
                            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
