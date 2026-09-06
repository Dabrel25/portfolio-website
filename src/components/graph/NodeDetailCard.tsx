"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { GraphNode } from "@/data/graph";
import { themeFor } from "@/lib/graph/theme";
import ImageCarousel from "./ImageCarousel";

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
  const hasImages = !!node?.images?.length;
  const hasHighlights = !!node?.highlights?.length;
  // Carousel-on-top + full-width bullet list below only makes sense once
  // there's both a carousel to show and highlights to break out as rows —
  // otherwise fall back to the plain paragraph layout (image-less/highlight-
  // less nodes, e.g. skills and "Me").
  const stacked = hasImages && hasHighlights;

  return (
    <AnimatePresence>
      {node && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-6">
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ borderColor: themeFor(node.category).color }}
            className="pointer-events-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white/95 p-6 shadow-2xl backdrop-blur"
          >
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
                <div className="mt-3">
                  <ImageCarousel images={node.images!} />
                </div>
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
              </>
            ) : (
              <>
                {hasImages && (
                  <div className="mt-3">
                    <ImageCarousel images={node.images!} />
                  </div>
                )}
                {node.description && (
                  <p className="mt-3 text-sm leading-relaxed text-[#4a493f]">{node.description}</p>
                )}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
