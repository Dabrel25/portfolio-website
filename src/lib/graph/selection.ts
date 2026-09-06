import type { Graph } from "@/data/graph";

export type SelectionState = {
  selectedNodeId: string | null;
  connectedNodeIds: Set<string>;
  visibleNodeIds: Set<string>;
  expandedNodeIds: Set<string>;
  /**
   * Nodes earned via chat/click this session — a monotonic superset of
   * visibleNodeIds. collapseToCenter re-derives visibility from this set
   * instead of resetting to the graph's static 1-hop neighbors, so a chat
   * reveal survives clicking "Overview".
   */
  revealedNodeIds: Set<string>;
};

/** Knowledge-graph section starts with only "Me" visible — everything else is earned via chat. */
export function initialSelection(graph: Graph): SelectionState {
  const visibleNodeIds = new Set<string>([graph.center]);
  return {
    selectedNodeId: null,
    connectedNodeIds: new Set(),
    visibleNodeIds,
    expandedNodeIds: new Set([graph.center]),
    revealedNodeIds: new Set([graph.center]),
  };
}

function neighborsOf(graph: Graph, nodeId: string): Set<string> {
  const neighbors = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.source === nodeId) neighbors.add(edge.target);
    if (edge.target === nodeId) neighbors.add(edge.source);
  }
  return neighbors;
}

/** Selecting a node reveals its neighbors (progressive disclosure) in addition to highlighting them. */
export function selectNode(graph: Graph, current: SelectionState, nodeId: string | null): SelectionState {
  if (!nodeId) {
    return { ...current, selectedNodeId: null, connectedNodeIds: new Set() };
  }

  const connectedNodeIds = neighborsOf(graph, nodeId);
  const visibleNodeIds = new Set(current.visibleNodeIds);
  const expandedNodeIds = new Set(current.expandedNodeIds);
  const revealedNodeIds = new Set(current.revealedNodeIds);
  visibleNodeIds.add(nodeId);
  revealedNodeIds.add(nodeId);
  for (const id of connectedNodeIds) {
    visibleNodeIds.add(id);
    revealedNodeIds.add(id);
  }
  expandedNodeIds.add(nodeId);

  return { selectedNodeId: nodeId, connectedNodeIds, visibleNodeIds, expandedNodeIds, revealedNodeIds };
}

/**
 * Collapses back to just the nodes earned so far (revealedNodeIds) instead of
 * resetting to the graph's static 1-hop neighbors — a chat-driven reveal
 * persists across "Overview" clicks, per the session-persistence requirement.
 */
export function collapseToCenter(graph: Graph, current: SelectionState): SelectionState {
  const visibleNodeIds = new Set(current.revealedNodeIds);
  for (const id of current.expandedNodeIds) {
    if (visibleNodeIds.has(id)) continue;
    const path = shortestPath(graph, graph.center, id);
    if (path) for (const stepId of path) visibleNodeIds.add(stepId);
  }
  return {
    selectedNodeId: null,
    connectedNodeIds: new Set(),
    visibleNodeIds,
    expandedNodeIds: current.expandedNodeIds,
    revealedNodeIds: current.revealedNodeIds,
  };
}

/**
 * Reveals every node in the given set (a chat-matched category cluster) plus
 * "me", without disturbing anything already visible/selected. Used by the
 * chat flow's stagger loop — called once per node as it's added so the
 * caller can animate nodes in one at a time rather than all at once.
 */
export function revealNodes(current: SelectionState, nodeIds: Iterable<string>): SelectionState {
  const visibleNodeIds = new Set(current.visibleNodeIds);
  const expandedNodeIds = new Set(current.expandedNodeIds);
  const revealedNodeIds = new Set(current.revealedNodeIds);
  for (const id of nodeIds) {
    visibleNodeIds.add(id);
    expandedNodeIds.add(id);
    revealedNodeIds.add(id);
  }
  return { ...current, visibleNodeIds, expandedNodeIds, revealedNodeIds };
}

/**
 * BFS distance from the center node to every other node, grouped into
 * "rings" by hop count (ring 1 = direct neighbors of center, ring 2 = their
 * neighbors, etc). Used to drive the slow, center-outward "wipe" reveal —
 * nodes in the same ring animate in together, rings cascade outward.
 */
export function bfsRingsFromCenter(graph: Graph): string[][] {
  const adjacency = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  const visited = new Set<string>([graph.center]);
  const rings: string[][] = [];
  let frontier = [graph.center];

  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        next.push(neighbor);
      }
    }
    if (next.length === 0) break;
    rings.push(next);
    frontier = next;
  }

  return rings;
}

export function isVisible(selection: SelectionState, nodeId: string): boolean {
  return selection.visibleNodeIds.has(nodeId);
}

/**
 * A node's label appears once it's been reached via click or chat-driven path
 * walk. While any node is focused/selected, all labels hide — the selected
 * node's details live in the centered detail card instead, so the graph
 * reads clean while that card is open.
 */
export function isLabeled(selection: SelectionState, nodeId: string): boolean {
  if (selection.selectedNodeId) return false;
  return selection.expandedNodeIds.has(nodeId);
}

export function isFaded(selection: SelectionState, nodeId: string): boolean {
  if (!selection.selectedNodeId) return false;
  if (nodeId === selection.selectedNodeId) return false;
  return !selection.connectedNodeIds.has(nodeId);
}

export function isEdgeFaded(selection: SelectionState, source: string, target: string): boolean {
  if (!selection.selectedNodeId) return false;
  return source !== selection.selectedNodeId && target !== selection.selectedNodeId;
}

/** BFS shortest path between two nodes, used to drive chat-triggered camera navigation. */
export function shortestPath(graph: Graph, fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];

  const adjacency = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  const visited = new Set<string>([fromId]);
  const queue: string[][] = [[fromId]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last === toId) return path;

    for (const neighbor of adjacency.get(last) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }

  return null;
}
