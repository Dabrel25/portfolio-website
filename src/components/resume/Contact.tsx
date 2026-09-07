"use client";

import { motion } from "motion/react";
import { profile } from "@/data/resume";

export default function Contact() {
  return (
    <footer id="contact" className="mx-auto w-full max-w-3xl px-6 py-24 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border p-10 text-center"
        style={{ borderColor: "#d6454530", backgroundColor: "#d645450a" }}
      >
        <h2 className="mb-2 font-mono text-sm font-semibold tracking-[0.2em] text-[#d64545] uppercase">
          Let&rsquo;s talk
        </h2>
        <p className="text-2xl font-bold text-[#1f1e1b]">Get in touch</p>
        <p className="mt-4 text-sm leading-relaxed text-[#4a493f]">
          Reach out at{" "}
          <a href={`mailto:${profile.email}`} className="font-medium text-[#1f1e1b] hover:underline">
            {profile.email}
          </a>{" "}
          or{" "}
          <a href={`tel:${profile.phone.replace(/\s+/g, "")}`} className="font-medium text-[#1f1e1b] hover:underline">
            {profile.phone}
          </a>
          .
        </p>
      </motion.div>
      <p className="mt-8 text-center font-mono text-xs text-[#a8a696]">
        © {new Date().getFullYear()} {profile.name}
      </p>
    </footer>
  );
}
