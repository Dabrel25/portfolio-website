import { experience, projects, education, skills, awards, type Job, type Project, type EducationEntry } from "./resume";
import type { GraphNode, GraphEdge } from "./graph";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function jobToNode(job: Job): GraphNode {
  return {
    id: `job-${slugify(job.company)}`,
    layer: "professional",
    category: "job",
    label: job.role,
    description: job.highlights.join(" "),
    highlights: job.highlights,
    images: job.images,
    meta: { company: job.company, location: job.location, dates: job.dates },
  };
}

function projectToNode(project: Project): GraphNode {
  return {
    id: `project-${slugify(project.name)}`,
    layer: "professional",
    category: "project",
    label: project.name,
    description: [project.description, ...project.highlights].join(" "),
    highlights: project.highlights,
    meta: { stack: project.stack.split(",").map((s) => s.trim()) },
    link: project.link,
  };
}

function educationToNode(entry: EducationEntry): GraphNode {
  return {
    id: `education-${slugify(entry.school)}`,
    layer: "professional",
    category: "education",
    label: entry.school,
    description: entry.detail,
    meta: { program: entry.program, location: entry.location, dates: entry.dates },
  };
}

function skillToNode(item: string): GraphNode {
  return {
    id: `skill-${slugify(item)}`,
    layer: "professional",
    category: "skill",
    label: item,
  };
}

function awardToNode(award: { title: string; detail: string }): GraphNode {
  return {
    id: `award-${slugify(award.title)}`,
    layer: "professional",
    category: "award",
    label: award.title,
    description: award.detail,
  };
}

export function buildProfessionalNodes(): GraphNode[] {
  const skillItems = skills.flatMap((group) => group.items);
  return [
    ...experience.map(jobToNode),
    ...projects.map(projectToNode),
    ...education.map(educationToNode),
    ...skillItems.map(skillToNode),
    ...awards.map(awardToNode),
  ];
}

function matchSkillIds(stack: string, skillItems: string[]): string[] {
  const stackTokens = stack.toLowerCase().split(",").map((s) => s.trim());
  return skillItems
    .filter((item) => stackTokens.some((token) => token.includes(item.toLowerCase()) || item.toLowerCase().includes(token)))
    .map((item) => `skill-${slugify(item)}`);
}

export function buildProfessionalEdges(): GraphEdge[] {
  const skillItems = skills.flatMap((group) => group.items);
  const edges: GraphEdge[] = [];
  const skillIdsUsedByProjects = new Set<string>();

  for (const job of experience) {
    edges.push({ source: "me", target: `job-${slugify(job.company)}`, label: "worked at" });
  }
  for (const entry of education) {
    edges.push({ source: "me", target: `education-${slugify(entry.school)}`, label: "learned from" });
  }
  for (const award of awards) {
    edges.push({ source: "me", target: `award-${slugify(award.title)}`, label: "earned" });
  }
  for (const project of projects) {
    edges.push({ source: "me", target: `project-${slugify(project.name)}`, label: "built" });
    for (const skillId of matchSkillIds(project.stack, skillItems)) {
      edges.push({ source: `project-${slugify(project.name)}`, target: skillId, label: "used" });
      skillIdsUsedByProjects.add(skillId);
    }
  }

  // Every skill needs at least one path back to "me" — skills matched to a
  // project above already have one via that project; the rest would
  // otherwise be unreachable floating nodes when the Skills category reveals.
  for (const item of skillItems) {
    const skillId = `skill-${slugify(item)}`;
    if (skillIdsUsedByProjects.has(skillId)) continue;
    edges.push({ source: "me", target: skillId, label: "knows" });
  }

  return edges;
}
