import { hobbyNodes, communityNodes, projectNodes, contentEdges } from "./graph-content";

export type NodeLayer = "identity" | "hobby" | "professional" | "community";

export type NodeCategory =
  | "self"
  | "interest"
  | "skill"
  | "project"
  | "job"
  | "education"
  | "award"
  | "community";

export type GraphNode = {
  id: string;
  layer: NodeLayer;
  category: NodeCategory;
  label: string;
  description?: string;
  highlights?: string[];
  images?: string[];
  meta?: Record<string, string | string[]>;
  link?: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  label: string;
  directional?: boolean;
};

export type Graph = {
  center: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const centerNode: GraphNode = {
  id: "me",
  layer: "identity",
  category: "self",
  label: "Darrel Ethan Ong",
  description: "AI engineer and hands-on builder.",
};

export function buildGraph(
  professionalNodes: GraphNode[],
  professionalEdges: GraphEdge[]
): Graph {
  const nodes = [centerNode, ...hobbyNodes, ...communityNodes, ...projectNodes, ...professionalNodes];
  const edges = [...contentEdges, ...professionalEdges];

  // Every skill needs at least one path back to "me" — skills already linked
  // from a project/job/hobby in graph-content have one; the rest would
  // otherwise be unreachable floating nodes when the Skills category reveals.
  const linkedIds = new Set(edges.flatMap((e) => [e.source, e.target]));
  for (const node of nodes) {
    if (node.category !== "skill" || linkedIds.has(node.id)) continue;
    edges.push({ source: "me", target: node.id, label: "knows" });
  }

  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) throw new Error(`Duplicate graph node id: ${node.id}`);
    nodeIds.add(node.id);
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) throw new Error(`Graph edge references unknown source node: ${edge.source}`);
    if (!nodeIds.has(edge.target)) throw new Error(`Graph edge references unknown target node: ${edge.target}`);
  }

  return { center: centerNode.id, nodes, edges };
}
