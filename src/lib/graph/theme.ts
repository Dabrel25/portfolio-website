import type { NodeCategory } from "@/data/graph";

export type NodeShape = "circle" | "hexagon" | "square" | "diamond" | "triangle";

export type CategoryTheme = {
  color: string;
  shape: NodeShape;
};

export const categoryTheme: Record<NodeCategory, CategoryTheme> = {
  self: { color: "#d64545", shape: "diamond" },
  interest: { color: "#4bb3a0", shape: "triangle" },
  skill: { color: "#5b8def", shape: "hexagon" },
  project: { color: "#e08a3e", shape: "square" },
  job: { color: "#3ea66b", shape: "circle" },
  education: { color: "#3ea66b", shape: "circle" },
  award: { color: "#d6b545", shape: "diamond" },
  community: { color: "#9b6bd6", shape: "circle" },
};

export function themeFor(category: NodeCategory): CategoryTheme {
  return categoryTheme[category];
}
