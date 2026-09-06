import type { Graph, NodeCategory } from "@/data/graph";

export type CategoryGroup = {
  key: string;
  label: string;
  categories: NodeCategory[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { key: "hobbies", label: "Hobbies", categories: ["interest"] },
  { key: "skills", label: "Skills", categories: ["skill"] },
  { key: "projects", label: "Projects / Awards", categories: ["project", "award"] },
  { key: "job-education", label: "Job / Education", categories: ["job", "education"] },
  { key: "community", label: "Community", categories: ["community"] },
];

const CATEGORY_TO_GROUP = new Map<NodeCategory, CategoryGroup>(
  CATEGORY_GROUPS.flatMap((group) => group.categories.map((category) => [category, group] as const))
);

/** "self" (the "me" node) and any future uncategorized category resolve to null — no cluster to reveal. */
export function groupForCategory(category: NodeCategory): CategoryGroup | null {
  return CATEGORY_TO_GROUP.get(category) ?? null;
}

/** Every node id in the graph belonging to one of the group's categories. */
export function nodeIdsForGroup(graph: Graph, group: CategoryGroup): string[] {
  const categorySet = new Set(group.categories);
  return graph.nodes.filter((n) => categorySet.has(n.category)).map((n) => n.id);
}
