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
 *
 * Reaching the graph LATCHES it: the 200vh scroll runway collapses to a
 * single viewport, so there is no longer any scroll range to reverse back
 * through. Without that latch, scrolling up inside the graph — including
 * the overscroll a trackpad emits when the 3D canvas hits its own zoom
 * limit — walks scrollYProgress back down and fades the hero in on top of
 * the graph the user is trying to use. Returning to the intro is a
 * deliberate act now, via the button, not something a stray scroll does.
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

  // Once the graph has been reached the intro is done; `latched` collapses
  // the scroll runway so it can't be scrolled back into. Starts true when
  // arriving via the resume's "Graph" link, which should skip the intro.
  const [latched, setLatched] = useState(startOnGraph);
  const [introKey, setIntroKey] = useState(0);
  const [returning, setReturning] = useState(false);

  // Coming back from the resume page's "Graph" link should land directly on
  // the graph, not replay the hero scroll intro from the top.
  useEffect(() => {
    if (!startOnGraph) return;
    window.scrollTo(0, 0);
    setGraphActive(true);
    setLatched(true);
  }, [startOnGraph]);

  const latchToGraph = () => {
    setGraphActive(true);
    setLatched(true);
    // Drop back to the top of the (now one-viewport-tall) container so the
    // collapse doesn't leave the window scrolled past the new page bottom.
    requestAnimationFrame(() => window.scrollTo(0, 0));
  };

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (latched || returning) return;
    if (v >= GRAPH_ACTIVE_THRESHOLD) latchToGraph();
  });

  // "change" only fires when the value actually moves, so returning to the
  // intro and scrolling straight back down can land on a progress value that
  // is already >= threshold without ever emitting an event — leaving the page
  // un-latched at the graph. Re-check the current value directly whenever the
  // latch is released.
  useEffect(() => {
    if (latched || returning) return;
    const check = () => {
      // Measure the container directly rather than trusting scrollYProgress.
      // After a return-to-intro its cached height is briefly the collapsed
      // one, which makes a quarter-way scroll read as ~1.0 and latch the user
      // into the graph while the hero is still half-visible.
      const el = containerRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = window.scrollY / scrollable;
      if (progress >= GRAPH_ACTIVE_THRESHOLD) latchToGraph();
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  });

  const returnToIntro = () => {
    // Jump to the top BEFORE restoring the runway. scrollYProgress is derived
    // from the container's measured height, and that measurement doesn't
    // update in the same frame the height class changes — restoring 200vh
    // while the window still sits at the bottom leaves progress reading ~1
    // (hero opacity 0) even though we're visually at the top. Scrolling
    // first means the re-expansion happens at scrollY 0, where progress is
    // unambiguously 0.
    window.scrollTo(0, 0);
    setReturning(true);
    requestAnimationFrame(() => {
      setLatched(false);
      setGraphActive(false);
      setIntroKey((k) => k + 1);
    });
  };

  // Hand control back to the scroll transforms once the container has actually
  // been re-measured — detected by scrollYProgress reporting a live value that
  // matches where the window really is. A plain `once: true` scroll listener
  // is not enough: that first scroll event is also the one the re-latch check
  // needs to see, and releasing on it would leave this frame's check gated off,
  // so scrolling back down to the graph would never re-latch.
  useEffect(() => {
    if (!returning) return;
    const release = () => {
      if (window.scrollY > 0) setReturning(false);
    };
    window.addEventListener("scroll", release, { passive: true });
    return () => window.removeEventListener("scroll", release);
  }, [returning]);

  const heroOpacityRaw = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const graphOpacityRaw = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  const heroOpacity = useMotionTemplate`${heroOpacityRaw}`;
  const graphOpacity = useMotionTemplate`${graphOpacityRaw}`;

  // While returning to the intro, drive the hero from plain state rather than
  // the scroll transform. scrollYProgress is derived from the container's
  // cached measured height, and that measurement is still the collapsed one
  // for a frame or more after the runway is restored — long enough that the
  // remounted hero reads opacity 0 and never becomes visible. `returning`
  // holds it at full opacity until a real scroll event takes over again.
  const heroStyle = returning
    ? { opacity: 1, scale: 1 }
    : { opacity: heroOpacity, scale: prefersReducedMotion ? 1 : heroScale };
  const graphStyle = { opacity: graphOpacity };

  return (
    <div ref={containerRef} className={`relative ${latched ? "h-screen" : "h-[200vh]"}`}>
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        {/* Latched: the hero is fully faded out and must not intercept
            clicks meant for the graph, so it leaves the tree entirely. */}
        {!latched && (
          <motion.div
            key={introKey}
            style={heroStyle}
            className={`absolute inset-0 z-10 ${graphActive ? "pointer-events-none" : ""}`}
          >
            <Hero />
          </motion.div>
        )}

        <motion.div
          style={latched ? undefined : graphStyle}
          className={`absolute inset-0 z-0 ${graphActive ? "" : "pointer-events-none"}`}
        >
          <GraphView active={graphActive} />
        </motion.div>

        {latched && (
          <motion.button
            type="button"
            onClick={returnToIntro}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            aria-label="Back to intro"
            title="Back to intro"
            className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e3d8] bg-[#f5f4ed]/80 text-[#4a493f] backdrop-blur transition-colors hover:bg-[#f5f4ed] hover:text-[#1f1e1b]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
}
