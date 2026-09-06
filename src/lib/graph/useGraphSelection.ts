"use client";

import { useState } from "react";
import type { Graph } from "@/data/graph";
import {
  initialSelection,
  selectNode,
  collapseToCenter,
  revealNodes,
  bfsRingsFromCenter,
  type SelectionState,
} from "./selection";

export function useGraphSelection(graph: Graph) {
  const [selection, setSelection] = useState<SelectionState>(() => initialSelection(graph));
  const introRevealed = true;

  const select = (nodeId: string | null) => {
    setSelection((current) => selectNode(graph, current, nodeId));
  };

  /**
   * Reveals a category cluster's nodes in a single update, all at once, so
   * physics settles once instead of re-reheating on every node added.
   * Returns whether any of the given ids were new — the caller uses this to
   * distinguish a first-time reveal from an already-known category (just
   * re-select, which reads as a light re-highlight via the existing pulse).
   */
  const revealCategory = (nodeIds: string[]): boolean => {
    const newIds = nodeIds.filter((id) => !selection.revealedNodeIds.has(id));
    if (newIds.length === 0) return false;
    setSelection((current) => revealNodes(current, newIds));
    return true;
  };

  /**
   * Reveals every node in the graph, ordered ring-by-ring outward from the
   * center (BFS hop distance) — drives the slow center-outward "wipe" that
   * plays once the invite headline's second phrase appears. Skills are
   * excluded from this auto-reveal (still reachable via chat/click as
   * normal) — the wipe is meant to show the shape of the graph, not every
   * category. Returns the flat ordered list of newly-revealed ids so the
   * caller can compute per-node stagger delays keyed by ring depth.
   */
  const revealAll = (): string[] => {
    const rings = bfsRingsFromCenter(graph);
    const skillNodeIds = new Set(graph.nodes.filter((node) => node.category === "skill").map((node) => node.id));
    const orderedIds = rings.flat().filter((id) => !selection.revealedNodeIds.has(id) && !skillNodeIds.has(id));
    if (orderedIds.length === 0) return [];
    setSelection((current) => revealNodes(current, orderedIds));
    return orderedIds;
  };

  const clear = () => select(null);

  const collapse = () => {
    setSelection((current) => collapseToCenter(graph, current));
  };

  return { selection, select, clear, collapse, introRevealed, revealCategory, revealAll };
}
