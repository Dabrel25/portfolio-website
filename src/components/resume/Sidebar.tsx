"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SECTION_ICONS } from "./sectionIcons";

const links = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "hobbies", label: "Hobbies" },
  { id: "community", label: "Community" },
  { id: "awards", label: "Awards" },
  { id: "contact", label: "Contact" },
];

export default function Sidebar() {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Scroll-spy: highlight whichever section currently occupies the vertical
  // center of the viewport, so the sidebar bubble tracks the part of the
  // résumé the visitor is actually reading rather than requiring a click.
  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed top-6 left-6 z-20 flex w-40 flex-col items-center gap-5 rounded-2xl bg-white/70 px-3 py-5 backdrop-blur">
      <Link
        href="/?graph=1"
        className="whitespace-nowrap rounded-full border border-[#e5e3d8] px-3 py-1.5 text-center font-mono text-xs uppercase text-[#8a8878] hover:text-[#1f1e1b]"
      >
        ← Graph
      </Link>
      <ul className="flex w-full flex-col items-center gap-1.5">
        {links.map((link) => (
          <li key={link.id} className="w-full">
            <a
              href={`#${link.id}`}
              className={`flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-center font-sans text-sm font-medium transition-colors ${
                activeId === link.id
                  ? "bg-[#e9e7dc] text-[#1f1e1b]"
                  : "text-[#8a8878] hover:bg-[#f0eee4] hover:text-[#1f1e1b]"
              }`}
            >
              <span className="flex-none">{SECTION_ICONS[link.id]}</span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
