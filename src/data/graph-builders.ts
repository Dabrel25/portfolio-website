import { experience, education, skills, type Job, type EducationEntry } from "./resume";
import { professionalOverrides, extraSkillNodes } from "./graph-content";
import type { GraphNode, GraphEdge } from "./graph";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function withOverrides(node: GraphNode): GraphNode {
  const override = professionalOverrides[node.id];
  return override ? { ...node, ...override } : node;
}

function jobToNode(job: Job): GraphNode {
  return withOverrides({
    id: `job-${slugify(job.company)}`,
    layer: "professional",
    category: "job",
    label: job.role,
    description: job.highlights.join(" "),
    highlights: job.highlights,
    images: job.images,
    meta: { company: job.company, location: job.location, dates: job.dates },
  });
}

function educationToNode(entry: EducationEntry): GraphNode {
  return withOverrides({
    id: `education-${slugify(entry.school)}`,
    layer: "professional",
    category: "education",
    label: entry.school,
    description: entry.detail,
    meta: { program: entry.program, location: entry.location, dates: entry.dates },
  });
}

function skillToNode(item: string): GraphNode {
  return {
    id: `skill-${slugify(item)}`,
    layer: "professional",
    category: "skill",
    label: item,
  };
}

/** Jobs, education, and skills — resume-derived (with per-node overrides from
 * graph-content), plus the extra hand-authored skills. Projects are fully
 * hand-authored in graph-content.ts and merged in buildGraph. */
export function buildProfessionalNodes(): GraphNode[] {
  const skillItems = skills.flatMap((group) => group.items);
  return [
    ...experience.map(jobToNode),
    ...education.map(educationToNode),
    ...skillItems.map(skillToNode),
    ...extraSkillNodes,
  ];
}

export function buildProfessionalEdges(): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const job of experience) {
    edges.push({ source: "me", target: `job-${slugify(job.company)}`, label: "worked at" });
  }
  for (const entry of education) {
    edges.push({ source: "me", target: `education-${slugify(entry.school)}`, label: "learned from" });
  }
  return edges;
}
