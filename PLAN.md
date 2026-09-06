# Plan

## Current state

The knowledge graph is a hand-built, in-memory TypeScript object graph:

- `src/data/graph.ts` / `graph-builders.ts` / `graph-full.ts` construct nodes
  and edges at import time from `src/data/resume.ts`'s structured resume data.
- `src/lib/graph/selection.ts` does all traversal (BFS rings from center,
  shortest-path for chat-driven camera walks) as plain in-memory JS, no
  database or query language involved.
- Rendering is `react-force-graph-3d` (Three.js + `d3-force-3d` physics).
- The chat feature (`src/app/api/chat/route.ts`) uses Langchain + Claude to
  answer questions and pick a target node id, which the frontend then
  resolves against the in-memory graph.

This works, but the graph structure is baked into the frontend bundle and any
traversal logic lives in ad-hoc TypeScript rather than a real graph query
layer.

## End goal: Neo4j-backed knowledge graph

Move the graph's source of truth into Neo4j so the site is backed by an
actual graph database instead of a static in-memory object:

- Model nodes/edges (self, interests, skills, projects, jobs, education,
  awards, community) as real Neo4j nodes and relationships instead of
  TypeScript objects.
- Replace the hand-rolled BFS in `selection.ts` with Cypher queries (shortest
  path, category-cluster reveal, ring-distance-from-center for the wipe
  reveal) — Neo4j does this natively instead of us reimplementing graph
  algorithms in application code.
- Chat/LLM integration queries Neo4j (via Langchain's Neo4j graph tooling)
  to ground answers in the actual graph structure, rather than picking a
  node id out of a fixed list and hoping it resolves.
- Frontend (`react-force-graph-3d`) becomes a pure rendering layer fed by an
  API that queries Neo4j, instead of importing a static graph object
  directly.

This is not yet started — no Neo4j instance, driver, or schema exists in
this repo today. Treat any mention of Neo4j elsewhere (README, repo
description) as describing this end goal, not current functionality.
