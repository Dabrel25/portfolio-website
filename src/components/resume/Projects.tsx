"use client";

import { motion } from "motion/react";
import Section from "./Section";
import NodePhoto, { PHOTO_HEIGHT_CAPS } from "./NodePhoto";
import { projectNodes } from "@/data/graph-content";

const ACCENT = "#e08a3e";

function metaList(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

type Project = (typeof projectNodes)[number];

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const stack = metaList(project.meta?.stack);
  const partners = metaList(project.meta?.partners);
  const award = project.meta?.award as string | undefined;
  const recognition = project.meta?.recognition as string | undefined;
  const reverse = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55 }}
      style={{ borderColor: `${ACCENT}30` }}
      className="group relative overflow-hidden rounded-2xl border bg-white/60 p-6 transition-shadow hover:shadow-lg sm:p-8"
    >
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ backgroundColor: ACCENT }}
      />

      {/* Explicit grid-column placement rather than `order`, and row-start-1
          on both children — same reasoning as Hobbies.tsx: the tracks are
          asymmetric, so `order` would swap which track's WIDTH each side
          gets, and on a reversed row the text (col-start-2) precedes the
          photo (col-start-1) in DOM order, which auto-placement would wrap
          onto a new implicit row instead of sharing row 1. */}
      {/* Center the photo only when the text is short enough to sit beside
          it; on a row with a long highlight list the text column runs 3-4x
          the photo's height, and centering strands empty space both above
          AND below the image. Top-aligning those rows keeps the photo next
          to the title it belongs to and collapses the leftover into one
          block instead of two. */}
      <div
        className={`grid gap-6 sm:grid-cols-[1fr_1.6fr] sm:gap-8 ${
          (project.highlights?.length ?? 0) > 1 ? "sm:items-start" : "sm:items-center"
        }`}
      >
        <div className={`sm:row-start-1 ${reverse ? "sm:col-start-2" : "sm:col-start-1"}`}>
          <NodePhoto
            src={project.images?.[0]}
            caption={`Add photo: ${project.label}`}
            aspect="wide"
            accentColor={ACCENT}
            maxHeightClass={
              (project.highlights?.length ?? 0) > 1 ? PHOTO_HEIGHT_CAPS.default : PHOTO_HEIGHT_CAPS.compact
            }
          />
        </div>

        <div className={`sm:row-start-1 ${reverse ? "sm:col-start-1" : "sm:col-start-2"}`}>
          <h3 className="text-xl font-bold text-[#1f1e1b]">
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
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: ACCENT }} />
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
            {partners && <p className="mb-2 font-mono text-xs text-[#8a8878]">Partners: {partners.join(", ")}</p>}
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
}

export default function Projects() {
  return (
    <Section id="projects" title="Projects" eyebrow="Things I've built" accentColor={ACCENT} wide>
      {/* Full-width horizontal rows with the photo alternating sides, the
          same rhythm Hobbies uses. This replaced a 3-column card grid: at
          a third of the container's width, a project's description plus
          three or four highlight bullets ran extremely tall and narrow,
          and equalizing row heights meant short cards padded out to match
          their tallest neighbor. Giving the text ~1.6x the photo's width
          across the full container is what actually removes that dead
          space rather than redistributing it. */}
      <div className="space-y-6">
        {projectNodes.map((project, i) => (
          <ProjectRow key={project.id} project={project} index={i} />
        ))}
      </div>
    </Section>
  );
}
