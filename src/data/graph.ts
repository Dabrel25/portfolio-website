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

// PLACEHOLDER — descriptions are generic; replace with real specifics later.
const hobbyNodes: GraphNode[] = [
  {
    id: "hobby-music",
    layer: "hobby",
    category: "interest",
    label: "Music",
    description: "PLACEHOLDER — replace with your real description of this hobby.",
  },
  {
    id: "hobby-basketball",
    layer: "hobby",
    category: "interest",
    label: "Basketball",
    description: "PLACEHOLDER — replace with your real description of this hobby.",
  },
  {
    id: "hobby-games-puzzles",
    layer: "hobby",
    category: "interest",
    label: "Games & Puzzles",
    description: "PLACEHOLDER — replace with your real description of this hobby.",
  },
  {
    id: "hobby-films-shows",
    layer: "hobby",
    category: "interest",
    label: "Films & Shows",
    description: "PLACEHOLDER — replace with your real description of this hobby.",
  },
];

// PLACEHOLDER — replace with real college orgs / humanitarian involvement.
const communityNodes: GraphNode[] = [
  {
    id: "community-org",
    layer: "community",
    category: "community",
    label: "PLACEHOLDER — College Org",
    description: "PLACEHOLDER — replace with your real description of this org and your role in it.",
  },
  {
    id: "community-humanitarian",
    layer: "community",
    category: "community",
    label: "PLACEHOLDER — Humanitarian Initiative",
    description: "PLACEHOLDER — replace with your real description of this cause and your involvement.",
  },
];

// PLACEHOLDER — replace with real edges connecting the above nodes to "me"
// and to each other. Professional-layer edges are added by mergeGraph() below
// from resume.ts data; add hand-authored cross-layer edges here (e.g. a hobby
// that inspired a project).
const handAuthoredEdges: GraphEdge[] = [
  { source: "me", target: "hobby-music", label: "enjoys" },
  { source: "me", target: "hobby-basketball", label: "enjoys" },
  { source: "me", target: "hobby-games-puzzles", label: "enjoys" },
  { source: "me", target: "hobby-films-shows", label: "enjoys" },
  { source: "me", target: "community-org", label: "member of" },
  { source: "me", target: "community-humanitarian", label: "involved in" },
];

export function buildGraph(
  professionalNodes: GraphNode[],
  professionalEdges: GraphEdge[]
): Graph {
  const nodes = [centerNode, ...hobbyNodes, ...communityNodes, ...professionalNodes];
  const edges = [...handAuthoredEdges, ...professionalEdges];

  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) throw new Error(`Graph edge references unknown source node: ${edge.source}`);
    if (!nodeIds.has(edge.target)) throw new Error(`Graph edge references unknown target node: ${edge.target}`);
  }

  return { center: centerNode.id, nodes, edges };
}
