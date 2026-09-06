"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useMotionTemplate, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import Hero from "./Hero";
import GraphView from "@/components/graph/GraphView";

/**
 * Scroll-driven crossfade from the hero into the knowledge graph.
 * The container is 200vh tall; the inner viewport is sticky, so scrolling
 * through the container's height maps 1:1 to scroll progress (0 -> 1) via
 * useScroll. Hero and graph are stacked absolutely and faded/scaled against
 * that same progress value so they read as one continuous camera move
 * rather than two separate transitions.
 *
 * The graph only becomes interactive (wheel/drag) once progress reaches
 * GRAPH_ACTIVE_THRESHOLD — until then it's pointer-events-none, so the
 * user's scroll always drives the page transition instead of being captured
 * by the 3D canvas's own zoom/pan controls.
 */
const GRAPH_ACTIVE_THRESHOLD = 0.98;

export default function LandingExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [graphActive, setGraphActive] = useState(false);
  const searchParams = useSearchParams();
  const startOnGraph = searchParams.get("graph") === "1";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Coming back from the resume page's "Graph" link should land directly on
  // the graph, not replay the hero scroll intro from the top.
  useEffect(() => {
    if (!startOnGraph || !containerRef.current) return;
    containerRef.current.scrollIntoView({ block: "end" });
    setGraphActive(true);
  }, [startOnGraph]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setGraphActive((current) => {
      if (!current && v >= GRAPH_ACTIVE_THRESHOLD) return true;
      if (current && v < GRAPH_ACTIVE_THRESHOLD) return false;
      return current;
    });
  });

  const heroOpacityRaw = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const graphOpacityRaw = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  const heroOpacity = useMotionTemplate`${heroOpacityRaw}`;
  const graphOpacity = useMotionTemplate`${graphOpacityRaw}`;

  const heroStyle = { opacity: heroOpacity, scale: prefersReducedMotion ? 1 : heroScale };
  const graphStyle = { opacity: graphOpacity };

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        <motion.div
          style={heroStyle}
          className={`absolute inset-0 z-10 ${graphActive ? "pointer-events-none" : ""}`}
        >
          <Hero />
        </motion.div>

        <motion.div
          style={graphStyle}
          className={`absolute inset-0 z-0 ${graphActive ? "" : "pointer-events-none"}`}
        >
          <GraphView active={graphActive} />
        </motion.div>
      </div>
    </div>
  );
}
