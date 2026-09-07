"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { GraphNode } from "@/data/graph";
import { themeFor } from "@/lib/graph/theme";
import ImageCarousel from "./ImageCarousel";

// User-resizable card dimensions (drag handles on the left/bottom edges).
// Width defaults to the old max-w-lg (32rem); height defaults to fitting the
// content (null) until the user drags the bottom handle.
const DEFAULT_CARD_WIDTH = 680;
const MIN_CARD_WIDTH = 320;
const MAX_CARD_WIDTH = 860;
const MIN_CARD_HEIGHT = 240;

/** A connected-node chip, colored by the target node's category. Hover
 * "lights up" the tag itself (stronger tint + full-strength border);
 * clicking navigates to that node, same as chat's inline node links. */
function ConnectionTag({ node, onClick }: { node: GraphNode; onClick?: (nodeId: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const { color } = themeFor(node.category);
  return (
    <button
      type="button"
      onClick={() => onClick?.(node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors"
      style={{
        borderColor: hovered ? color : `${color}66`,
        backgroundColor: hovered ? `${color}2e` : `${color}14`,
        color: "#4a493f",
      }}
    >
      {node.label}
    </button>
  );
}

export default function NodeDetailCard({
  node,
  connections,
  onClose,
  onNodeClick,
}: {
  node: GraphNode | null;
  connections: GraphNode[];
  onClose: () => void;
  onNodeClick?: (nodeId: string) => void;
}) {
  // Size state lives here (not inside the keyed motion.div) so a chosen size
  // survives switching between nodes. height === null means "fit content".
  const [cardWidth, setCardWidth] = useState(DEFAULT_CARD_WIDTH);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ axis: "x" | "y"; startPos: number; startSize: number } | null>(null);

  const startResizeX = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { axis: "x", startPos: e.clientX, startSize: cardWidth };
  };

  const startResizeY = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const measuredHeight = cardRef.current?.offsetHeight ?? MIN_CARD_HEIGHT;
    dragRef.current = { axis: "y", startPos: e.clientY, startSize: cardHeight ?? measuredHeight };
  };

  const moveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.axis === "x") {
      // The card's right edge is pinned to the chat dock, so dragging the
      // left handle leftward grows the card.
      const next = drag.startSize + (drag.startPos - e.clientX);
      setCardWidth(Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, next)));
    } else {
      // Vertically centered card: the bottom edge moves at half the height
      // delta, so double the pointer delta to keep the handle under the cursor.
      const next = drag.startSize + (e.clientY - drag.startPos) * 2;
      // Matches the card's max-h-[70vh] CSS cap so the handle never drags past it.
      const maxHeight = Math.round(window.innerHeight * 0.7);
      setCardHeight(Math.min(maxHeight, Math.max(MIN_CARD_HEIGHT, next)));
    }
  };

  const endResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  const hasImages = !!node?.images?.length;
  const hasHighlights = !!node?.highlights?.length;
  // Carousel-on-top + full-width bullet list below only makes sense once
  // there's both a carousel to show and highlights to break out as rows —
  // otherwise fall back to the plain paragraph layout (image-less/highlight-
  // less nodes, e.g. skills and "Me").
  const stacked = hasImages && hasHighlights;
  // Nodes whose writeup leads into their images (e.g. Learning's "here are
  // some of the worlds I explore through:") place the carousel after the text.
  const imagesAtBottom = node?.imagePlacement === "bottom";
  const carousel = hasImages && (
    <div className="mt-3">
      <ImageCarousel images={node!.images!} />
    </div>
  );

  // The card docks against the chat bar like a drawer (right edge flush with
  // the graph pane's right edge, which is the chat dock's left edge when the
  // chat is docked), vertically centered — instead of floating mid-pane.
  return (
    <AnimatePresence>
      {node && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-end py-6 pr-10">
          <motion.div
            key={node.id}
            ref={cardRef}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              borderColor: themeFor(node.category).color,
              width: cardWidth,
              height: cardHeight ?? undefined,
            }}
            className="pointer-events-auto relative max-h-[70vh] overflow-hidden rounded-2xl border bg-white/95 shadow-2xl backdrop-blur"
          >
            <div className="h-full max-h-[70vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#8a8878]">{node.category}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#1f1e1b]">{node.label}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#8a8878] hover:text-[#1f1e1b]"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {stacked ? (
                <>
                  {!imagesAtBottom && carousel}
                  {node.description && (
                    <p className="mt-3 text-sm leading-relaxed text-[#4a493f]">{node.description}</p>
                  )}
                  <ul className="mt-3 space-y-2 text-sm leading-snug text-[#4a493f]">
                    {node.highlights!.map((point, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: themeFor(node.category).color }} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {imagesAtBottom && carousel}
                </>
              ) : (
                <>
                  {!imagesAtBottom && carousel}
                  {node.description && (
                    <p className="mt-3 text-sm leading-relaxed text-[#4a493f]">{node.description}</p>
                  )}
                  {imagesAtBottom && carousel}
                </>
              )}

              {node.meta && (
                <dl className="mt-4 space-y-1 font-mono text-xs text-[#8a8878]">
                  {Object.entries(node.meta).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <dt className="uppercase">{key}:</dt>
                      <dd>{Array.isArray(value) ? value.join(", ") : value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {node.link && (
                <a
                  href={node.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-[#1f1e1b] hover:underline"
                >
                  View →
                </a>
              )}

              {connections.length > 0 && (
                <div className="mt-4 border-t border-[#e5e3d8] pt-3">
                  <p className="mb-2 text-xs font-mono uppercase tracking-widest text-[#8a8878]">Connected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {connections.map((connected) => (
                      <ConnectionTag key={connected.id} node={connected} onClick={onNodeClick} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resize handles: left edge adjusts width, bottom edge adjusts height. */}
            <div
              role="separator"
              aria-label="Resize card width"
              aria-orientation="vertical"
              onPointerDown={startResizeX}
              onPointerMove={moveResize}
              onPointerUp={endResize}
              className="absolute top-0 left-0 h-full w-2 cursor-col-resize touch-none"
            />
            <div
              role="separator"
              aria-label="Resize card height"
              aria-orientation="horizontal"
              onPointerDown={startResizeY}
              onPointerMove={moveResize}
              onPointerUp={endResize}
              className="absolute bottom-0 left-0 h-2 w-full cursor-row-resize touch-none"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
