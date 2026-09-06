/**
 * Mirrors the portfolio's knowledge graph into the local dev Neo4j instance
 * (docker-compose.neo4j.yml). Wipes and reloads on every run, so it's always
 * an exact snapshot of src/data — Neo4j is a read-only mirror for exploring
 * the graph in Neo4j Browser / Cypher, never the source of truth.
 *
 * Run: npm run neo4j:seed
 */
import neo4j from "neo4j-driver";
import { graph } from "../src/data/graph-full";
import type { NodeCategory } from "../src/data/graph";

const URI = process.env.NEO4J_URI ?? "bolt://localhost:7687";
const USER = process.env.NEO4J_USER ?? "neo4j";
const PASSWORD = process.env.NEO4J_PASSWORD ?? "portfolio-dev-password";

/** Neo4j label per category — Person for "me", PascalCase category otherwise. */
const CATEGORY_LABEL: Record<NodeCategory, string> = {
  self: "Person",
  interest: "Hobby",
  skill: "Skill",
  project: "Project",
  job: "Job",
  education: "Education",
  award: "Award",
  community: "Community",
};

/** "built at" -> BUILT_AT etc. Relationship types can't be parameterized in
 * Cypher, so these are interpolated — sanitize to be safe. */
function relType(label: string): string {
  return label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "") || "RELATES_TO";
}

async function main() {
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();
  try {
    await session.run("MATCH (n) DETACH DELETE n");

    for (const node of graph.nodes) {
      const label = CATEGORY_LABEL[node.category];
      await session.run(
        `CREATE (n:Node:${label} {id: $id, name: $name, category: $category, layer: $layer, description: $description, link: $link})`,
        {
          id: node.id,
          name: node.label,
          category: node.category,
          layer: node.layer,
          description: node.description ?? null,
          link: node.link ?? null,
        }
      );
    }

    for (const edge of graph.edges) {
      await session.run(
        `MATCH (a:Node {id: $source}), (b:Node {id: $target})
         CREATE (a)-[:${relType(edge.label)} {label: $label}]->(b)`,
        { source: edge.source, target: edge.target, label: edge.label }
      );
    }

    const counts = await session.run(
      "MATCH (n) OPTIONAL MATCH ()-[r]->() RETURN count(DISTINCT n) AS nodes, count(DISTINCT r) AS rels"
    );
    const row = counts.records[0];
    console.log(`Seeded ${row.get("nodes")} nodes and ${row.get("rels")} relationships.`);
    console.log("Explore at http://localhost:7474 (neo4j / portfolio-dev-password)");
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  console.error("Is the container up? Try: npm run neo4j:up");
  process.exit(1);
});
