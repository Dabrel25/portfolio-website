"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { graph } from "@/data/graph-full";
import { useGraphSelection } from "@/lib/graph/useGraphSelection";
import { bfsRingsFromCenter } from "@/lib/graph/selection";
import { groupForCategory, nodeIdsForGroup } from "@/lib/graph/categories";
import GraphEngine3D, { type CameraDebugInfo } from "./GraphEngine3D";
import GraphLegend from "./GraphLegend";
import { SECTION_ICONS } from "@/components/resume/sectionIcons";
import NodeDetailCard from "./NodeDetailCard";
import DebugCoordsOverlay from "./DebugCoordsOverlay";
import ChatPanel, { type ChatStatus } from "@/components/chat/ChatPanel";
import ChatComposer from "@/components/chat/ChatComposer";
import FaqChips from "@/components/chat/FaqChips";
import InviteHeadline from "@/components/chat/InviteHeadline";
import type { ChatTurn } from "@/components/chat/ChatMessage";

const SWOOSH_TRANSITION = { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const };
const DEFAULT_DOCK_WIDTH = 380;
const MIN_DOCK_WIDTH = 280;
const MAX_DOCK_WIDTH = 560;
const CENTERED_WIDTH = 780;
const INVITE_TYPING_HEIGHT = 130;
const INVITE_HEIGHT = 240;
const CARD_HEIGHT = 320;
const ENTRANCE_SETTLE_MS = 1000;
// Ring-to-ring delay for the invite headline's slow center-outward "wipe"
// reveal — deliberately slow per the user's explicit "SLOWLY" ask, distinct
// from the fast ~90ms/node stagger used by ordinary chat-driven reveals.
// A small per-node jitter within each ring keeps a ring from popping in as
// one rigid shell.
const WIPE_RING_DELAY_MS = 550;
const WIPE_NODE_JITTER_MS = 120;

const FALLBACK_ANSWER_HINT =
  " Feel free to ask about my hobbies, skills, projects and awards, job and education, or community involvement.";

const RESUME_SECTION_LINKS = [
  { section: "experience", label: "Experience" },
  { section: "projects", label: "Projects" },
  { section: "education", label: "Education" },
  { section: "skills", label: "Skills" },
  { section: "hobbies", label: "Hobbies" },
  { section: "community", label: "Community" },
  { section: "awards", label: "Awards" },
  { section: "contact", label: "Contact" },
];

// Matches the graph->resume dissolve fade duration below so the navigation
// fires right as the graph has fully faded to the background color.
const RESUME_DISSOLVE_MS = 400;
// How long to withhold the overlay chrome (Overview button, Legend, Résumé
// sidebar) after the graph section becomes active — long enough for the
// seed nodes' entrance animation (GraphEngine3D's ENTRANCE_MS = 900) to
// finish, so none of this UI is visible during the initial scroll-in frames.
const OVERLAY_CHROME_DELAY_MS = 1000;

// The Legend/Résumé panels scale in from their trigger bubble (top-left
// transform origin, matching the bubbles' position at top-6 left-6) rather
// than just appearing, so opening one reads as the bubble expanding into
// the panel rather than an instant swap.
const PANEL_VARIANTS = {
  initial: { opacity: 0, scale: 0.15 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.15 },
};

export default function GraphView({ active = true }: { active?: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const debugCoords = searchParams.get("debugCoords") === "1";
  const [dissolving, setDissolving] = useState(false);
  const [cameraDebug, setCameraDebug] = useState<CameraDebugInfo | null>(null);
  const { selection, select, collapse, introRevealed, revealCategory, revealAll } = useGraphSelection(graph);
  const selectedNode = graph.nodes.find((n) => n.id === selection.selectedNodeId) ?? null;
  // Every node connected to the selected one (either edge direction), for the
  // detail card's connection tags. Deduped in case of parallel edges.
  const selectedConnections = selectedNode
    ? [
        ...new Map(
          graph.edges
            .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
            .map((e) => (e.source === selectedNode.id ? e.target : e.source))
            .flatMap((id) => {
              const connected = graph.nodes.find((n) => n.id === id);
              return connected ? [[id, connected] as const] : [];
            })
        ).values(),
      ]
    : [];
  const [chatStatus, setChatStatus] = useState<ChatStatus>("idle");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [chatOpen, setChatOpen] = useState(true);
  const [docking, setDocking] = useState(false);
  const [docked, setDocked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [openPanel, setOpenPanel] = useState<"legend" | "resume" | null>(null);
  const [headlineDone, setHeadlineDone] = useState(false);
  const [dockWidth, setDockWidth] = useState(DEFAULT_DOCK_WIDTH);
  const [isResizingDock, setIsResizingDock] = useState(false);
  const [wipeRevealDelays, setWipeRevealDelays] = useState<Map<string, number>>();
  const hasWipedRef = useRef(false);
  const [resetCameraSignal, setResetCameraSignal] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(false);

  // Resets both which nodes are selected/highlighted AND the camera framing
  // back to the fixed overview pose — otherwise "Overview" would clear the
  // selection but leave the visitor's free-orbited/zoomed view unchanged.
  const handleOverviewClick = () => {
    collapse();
    setResetCameraSignal((n) => n + 1);
  };

  // Legend/Résumé bubbles are a one-open-at-a-time accordion: clicking the
  // already-open bubble closes it, clicking the other one switches panels.
  const togglePanel = (panel: "legend" | "resume") => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  // Fades the graph to the background color, then navigates to the résumé
  // page scrolled to the requested section — reads as the graph "dissolving"
  // into the résumé rather than a plain route change. fromGraph=1 tells the
  // résumé page to render its floating sidebar instead of the top Nav bar.
  const handleResumeSectionClick = (section: string) => {
    if (dissolving) return;
    setDissolving(true);
    setOpenPanel(null);
    setTimeout(() => {
      router.push(`/resume?fromGraph=1#${section}`);
    }, RESUME_DISSOLVE_MS);
  };

  // Fires when the invite headline's "All my hobbies..." phrase (index 1)
  // appears — reveals every not-yet-seen node/edge at once, ordered
  // ring-by-ring outward from the center via BFS hop distance, each ring
  // delayed WIPE_RING_DELAY_MS after the last so it reads as a slow wipe
  // radiating out from the middle rather than a normal (fast) chat reveal.
  const handleInvitePhrase = (phraseIndex: number) => {
    if (phraseIndex !== 1 || hasWipedRef.current) return;
    hasWipedRef.current = true;
    const rings = bfsRingsFromCenter(graph);
    const delays = new Map<string, number>();
    rings.forEach((ring, ringIndex) => {
      ring.forEach((id) => {
        delays.set(id, ringIndex * WIPE_RING_DELAY_MS + Math.random() * WIPE_NODE_JITTER_MS);
      });
    });
    setWipeRevealDelays(delays);
    revealAll();
  };

  useEffect(() => {
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) setViewport({ width: rect.width, height: rect.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Withhold the overlay chrome until the graph section is active AND the
  // seed nodes have finished their entrance animation, so none of it flashes
  // in during the hero->graph scroll crossfade or the initial node reveal.
  // The cleanup (not the effect body) resets chromeVisible to false so that
  // scrolling away and back re-plays the delay instead of showing chrome
  // instantly the second time. The legend opens itself at the same moment
  // the chrome appears, as a one-time hint that the bubbles are clickable.
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      setChromeVisible(true);
      setOpenPanel("legend");
    }, OVERLAY_CHROME_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setChromeVisible(false);
    };
  }, [active]);

  const finishTurn = (question: string, answer: string, images?: string[], isError?: boolean) => {
    setChatStatus(isError ? "error" : "idle");
    setTurns((prev) => {
      const next = [...prev];
      next[next.length - 1] = { question, answer, images, isError };
      return next;
    });
    if (isError) {
      setTimeout(() => setChatStatus("idle"), 1500);
    }
  };

  // Reveals a node's category cluster (if not already known) and highlights
  // it. Shared by the chat route's own targetNodeId handling and by
  // in-answer node links, so clicking a node mentioned mid-answer behaves
  // identically to asking a question that lands on that node. Nodes fade/
  // scale in in place (GraphEngine3D) rather than the camera chasing each
  // one. Selecting happens immediately (not after the settle delay) so the
  // selection exists before GraphEngine3D's reveal re-fit effect checks for
  // one — an existing selection suppresses that re-fit, so the left-framing
  // camera swivel plays once, cleanly, instead of being interrupted partway
  // through the re-fit's zoomToFit transition. onDone (surfacing the chat
  // answer) still waits for nodes to visually settle first.
  const navigateToNode = (nodeId: string, onDone?: () => void) => {
    const targetNode = graph.nodes.find((n) => n.id === nodeId);
    const group = targetNode ? groupForCategory(targetNode.category) : null;

    if (!group) {
      select(nodeId);
      onDone?.();
      return;
    }

    const groupNodeIds = nodeIdsForGroup(graph, group);
    const isNewReveal = revealCategory(groupNodeIds);
    select(nodeId);
    const settleMs = prefersReducedMotion ? 0 : ENTRANCE_SETTLE_MS;
    setTimeout(() => onDone?.(), isNewReveal ? settleMs : 0);
  };

  const handleNodeLinkClick = (nodeId: string) => {
    if (chatStatus === "thinking") return;
    if (!graph.nodes.some((n) => n.id === nodeId)) return;
    navigateToNode(nodeId);
  };

  const handleAsk = async (question: string, deepSearch = false) => {
    setChatStatus("thinking");
    setTurns((prev) => [...prev, { question, answer: null }]);
    if (!docked) setDocking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, deepSearch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      const targetNode = data.targetNodeId ? graph.nodes.find((n) => n.id === data.targetNodeId) : null;
      const group = targetNode ? groupForCategory(targetNode.category) : null;

      if (!group) {
        // Fallback: no clear category match ("me" or an uncategorized node).
        // Pulse "me" so the graph still feels responsive, and nudge the
        // visitor toward the kinds of questions that do land on a cluster.
        setChatStatus("idle");
        select(graph.center);
        finishTurn(question, `${data.answer}${FALLBACK_ANSWER_HINT}`, data.images);
        return;
      }

      navigateToNode(data.targetNodeId, () => finishTurn(question, data.answer, data.images));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong answering that — try again.";
      finishTurn(question, message, undefined, true);
    }
  };

  const openChat = () => {
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
  };

  // Dragging the dock's left-edge handle. Pointer capture means the move/up
  // listeners only need to live on the handle itself, not the window.
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsResizingDock(true);
  };

  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // No isResizingDock check here: pointermove only reaches this handler
    // while the pointer is captured by handleResizeStart below, so there's
    // no case where a move arrives outside an active drag. Gating on the
    // React state instead would race — setIsResizingDock(true) hasn't
    // necessarily committed yet by the time the first move event lands.
    const next = viewport.width - e.clientX;
    const clamped = Math.min(MAX_DOCK_WIDTH, Math.max(MIN_DOCK_WIDTH, next));
    setDockWidth(clamped);
  };

  const handleResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsResizingDock(false);
  };

  const showInvite = !docking && !docked && turns.length === 0;
  const isDockedPose = docking || docked;

  const centeredHeight = showInvite ? (headlineDone ? INVITE_HEIGHT : INVITE_TYPING_HEIGHT) : CARD_HEIGHT;
  const pose = isDockedPose
    ? { width: dockWidth, height: viewport.height, x: viewport.width - dockWidth, y: 0, borderRadius: 0 }
    : {
        width: CENTERED_WIDTH,
        height: centeredHeight,
        x: (viewport.width - CENTERED_WIDTH) / 2,
        y: viewport.height * 0.96 - centeredHeight,
        borderRadius: 16,
      };

  return (
    <div ref={rootRef} className="relative h-screen w-screen overflow-hidden bg-[#faf8f5]">
      <div
        className={`relative h-full ${isResizingDock ? "" : "transition-[width,opacity] duration-300"}`}
        style={{
          width: docked && chatOpen ? viewport.width - dockWidth : viewport.width,
          opacity: dissolving ? 0 : 1,
          transitionDuration: dissolving ? `${RESUME_DISSOLVE_MS}ms` : undefined,
        }}
      >
        <GraphEngine3D
          graph={graph}
          selection={selection}
          onNodeClick={(id) => select(id || null)}
          introRevealed={introRevealed && active}
          onCameraDebugUpdate={debugCoords ? setCameraDebug : undefined}
          revealDelays={wipeRevealDelays}
          resetCameraSignal={resetCameraSignal}
        />

        <div
          className={`transition-opacity duration-500 ${chromeVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="absolute top-6 left-6 z-20 flex items-start gap-3">
            <button
              onClick={handleOverviewClick}
              className="rounded-full border border-[#e5e3d8] bg-white/80 px-4 py-2 font-mono text-xs uppercase text-[#6b6a62] backdrop-blur hover:text-[#1f1e1b]"
            >
              ↺ Overview
            </button>

            {/* relative wrapper so its panel below can be positioned/scaled
                relative to *this* bubble specifically, not the row's left
                edge — the panel's transform-origin needs to sit on the
                bubble's own center, not an arbitrary corner. */}
            <div className="relative">
              <button
                onClick={() => togglePanel("legend")}
                aria-label="Toggle legend"
                aria-expanded={openPanel === "legend"}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border backdrop-blur transition-colors ${
                  openPanel === "legend"
                    ? "border-[#1f1e1b] bg-[#1f1e1b] text-white"
                    : "border-[#e5e3d8] bg-white/80 text-[#6b6a62] hover:text-[#1f1e1b]"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="4" cy="4" r="1.6" fill="currentColor" />
                  <path d="M8 3.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="4" cy="8" r="1.6" fill="currentColor" />
                  <path d="M8 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="4" cy="12" r="1.6" fill="currentColor" />
                  <path d="M8 12.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              <AnimatePresence>
                {openPanel === "legend" && (
                  <motion.div
                    key="legend"
                    initial={PANEL_VARIANTS.initial}
                    animate={PANEL_VARIANTS.animate}
                    exit={PANEL_VARIANTS.exit}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
                    style={{ transformOrigin: "top center" }}
                    className="absolute top-12 left-1/2 z-20 -translate-x-1/2"
                  >
                    <GraphLegend />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => togglePanel("resume")}
                aria-label="Toggle résumé sections"
                aria-expanded={openPanel === "resume"}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border backdrop-blur transition-colors ${
                  openPanel === "resume"
                    ? "border-[#1f1e1b] bg-[#1f1e1b] text-white"
                    : "border-[#e5e3d8] bg-white/80 text-[#6b6a62] hover:text-[#1f1e1b]"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2H10L12.5 4.5V13.5C12.5 13.8 12.2 14 12 14H4C3.8 14 3.5 13.8 3.5 13.5V2.5C3.5 2.2 3.8 2 4 2Z" />
                  <path d="M10 2V4.5H12.5" />
                  <path d="M5.5 8H10.5" />
                  <path d="M5.5 10.5H10.5" />
                </svg>
              </button>

              <AnimatePresence>
                {openPanel === "resume" && (
                  <motion.div
                    key="resume"
                    initial={PANEL_VARIANTS.initial}
                    animate={PANEL_VARIANTS.animate}
                    exit={PANEL_VARIANTS.exit}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
                    style={{ transformOrigin: "top center" }}
                    className="absolute top-12 left-1/2 z-20 flex w-48 -translate-x-1/2 flex-col items-center gap-1 rounded-2xl bg-white/80 px-3 py-4 backdrop-blur"
                  >
                    {RESUME_SECTION_LINKS.map(({ section, label }) => (
                      <button
                        key={section}
                        onClick={() => handleResumeSectionClick(section)}
                        className="flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.5 text-center font-sans text-sm font-medium text-[#6b6a62] transition-colors hover:bg-[#f0eee4] hover:text-[#1f1e1b]"
                      >
                        <span className="flex-none">{SECTION_ICONS[section]}</span>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!chatOpen && docked && (
            <div className="absolute top-6 right-6 z-20">
              <button
                onClick={openChat}
                className="rounded-full border border-[#e5e3d8] bg-white/80 px-4 py-2 font-mono text-xs uppercase text-[#6b6a62] backdrop-blur hover:text-[#1f1e1b]"
              >
                Ask about me
              </button>
            </div>
          )}
        </div>

        <NodeDetailCard
          node={selectedNode}
          connections={selectedConnections}
          onClose={() => select(null)}
          onNodeClick={handleNodeLinkClick}
        />
        {debugCoords && (
          <DebugCoordsOverlay graph={graph} selectedNodeId={selection.selectedNodeId} camera={cameraDebug} />
        )}
      </div>

      {chatOpen && introRevealed && (
        <motion.div
          initial={false}
          animate={pose}
          transition={isResizingDock ? { duration: 0 } : SWOOSH_TRANSITION}
          onAnimationComplete={() => {
            if (docking) {
              setDocking(false);
              setDocked(true);
            }
          }}
          className={`absolute top-0 left-0 z-30 flex flex-col overflow-hidden border border-[#e5e3d8] bg-white ${
            isDockedPose ? "shadow-none" : "shadow-xl"
          } ${isResizingDock ? "select-none" : ""}`}
        >
          {docked && (
            <div
              role="separator"
              aria-label="Resize chat"
              aria-orientation="vertical"
              onPointerDown={handleResizeStart}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              className="absolute top-0 left-0 z-40 h-full w-2 -translate-x-1/2 cursor-col-resize touch-none"
            />
          )}
          {showInvite ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <InviteHeadline active={active} onDone={() => setHeadlineDone(true)} onPhrase={handleInvitePhrase} />
              {headlineDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex w-full flex-col items-center gap-4"
                >
                  <FaqChips onAsk={handleAsk} disabled={chatStatus === "thinking"} />
                  <div className="w-full">
                    <ChatComposer status={chatStatus} onAsk={handleAsk} autoFocus={active} />
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={closeChat}
                className="absolute top-4 right-4 z-30 text-[#8a8878] hover:text-[#1f1e1b]"
                aria-label="Close chat"
              >
                ×
              </button>
              <ChatPanel status={chatStatus} turns={turns} onAsk={handleAsk} onNodeClick={handleNodeLinkClick} />
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
