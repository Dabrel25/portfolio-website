"use client";

import { motion } from "motion/react";
import { profile } from "@/data/resume";
import NodePhoto from "./NodePhoto";

export default function Hero() {
  return (
    <header className="mx-auto w-full max-w-5xl px-6 pt-24 pb-20 sm:px-8">
      <div className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-4 font-mono text-sm font-semibold tracking-[0.25em] text-[#d64545] uppercase">
            {profile.title}
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-[#1f1e1b] sm:text-6xl">
            {profile.name}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#4a493f]">{profile.summary}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-[#8a8878]">
            <span>{profile.location}</span>
            <a href={`mailto:${profile.email}`} className="hover:text-[#1f1e1b]">
              {profile.email}
            </a>
            <a href={`tel:${profile.phone.replace(/\s+/g, "")}`} className="hover:text-[#1f1e1b]">
              {profile.phone}
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#1f1e1b]">
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#1f1e1b]">
              LinkedIn
            </a>
          </div>
        </motion.div>

        <div className="w-40 sm:w-48">
          <NodePhoto src={profile.photo} caption={`Add photo: ${profile.name}`} aspect="portrait" accentColor="#d64545" />
        </div>
      </div>
    </header>
  );
}
