"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "./Nav";
import Sidebar from "./Sidebar";
import Hero from "./Hero";
import Experience from "./Experience";
import Projects from "./Projects";
import Education from "./Education";
import Skills from "./Skills";
import Awards from "./Awards";
import Contact from "./Contact";

export default function ResumeContent() {
  const searchParams = useSearchParams();
  const fromGraph = searchParams.get("fromGraph") === "1";

  // Client-side navigation (router.push from the graph) commits before this
  // component mounts, so Next's own hash-scroll-on-navigate finds nothing to
  // scroll to yet — do it ourselves once the sections actually exist.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView();
  }, []);

  return (
    <div className="flex flex-1 flex-col bg-[#f5f4ed]">
      {fromGraph ? <Sidebar /> : <Nav />}
      <Hero />
      <div className="divide-y divide-[#e5e3d8]">
        <Experience />
        <Projects />
        <Education />
        <Skills />
        <Awards />
      </div>
      <Contact />
    </div>
  );
}
