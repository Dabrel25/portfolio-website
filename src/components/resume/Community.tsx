"use client";

import { motion } from "motion/react";
import Section from "./Section";
import NodePhoto from "./NodePhoto";
import { communityNodes } from "@/data/graph-content";

const ACCENT = "#9b6bd6";

export default function Community() {
  return (
    <Section id="community" title="Community" eyebrow="Who I've served" accentColor={ACCENT} wide>
      <div className="space-y-16">
        {communityNodes.map((org) => {
          const roles = org.meta?.roles;
          const rolesList = Array.isArray(roles) ? roles : undefined;

          return (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
              className="overflow-hidden rounded-2xl border bg-white/60"
              style={{ borderColor: `${ACCENT}30` }}
            >
              <div className="grid gap-0 sm:grid-cols-2">
                <div className="grid h-full grid-cols-2 gap-1">
                  {(org.images ?? []).map((src, idx) => (
                    <NodePhoto
                      key={idx}
                      src={src}
                      caption={`Add photo: ${org.label} ${idx + 1}`}
                      accentColor={ACCENT}
                      className="rounded-none border-0"
                      fill
                    />
                  ))}
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-[#1f1e1b]">{org.label}</h3>
                  {rolesList && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {rolesList.map((role) => (
                        <span
                          key={role}
                          className="w-fit rounded-full px-3 py-1 font-mono text-xs font-medium"
                          style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-[15px] leading-relaxed text-[#4a493f]">{org.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
