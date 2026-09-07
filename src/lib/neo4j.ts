import neo4j, { Driver } from "neo4j-driver";

let driver: Driver | null = null;

// Once a connection attempt has failed, don't pay the driver's slow
// connect-timeout again on every subsequent tool call in the same process —
// re-checked periodically in case Neo4j comes back.
let lastFailureAt: number | null = null;
const RETRY_AFTER_MS = 60_000;

/** Singleton driver — reused across requests, never opened per-request. */
export function getNeo4jDriver(): Driver {
  if (lastFailureAt && Date.now() - lastFailureAt < RETRY_AFTER_MS) {
    throw new Error("Neo4j recently failed to connect — skipping retry for now.");
  }

  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;
    if (!uri || !user || !password) {
      throw new Error(
        "Neo4j is not configured — set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD."
      );
    }
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      // Fail fast so an unreachable Neo4j falls back to the static graph
      // quickly instead of stalling the request on the driver's default.
      connectionTimeout: 5000,
    });
  }
  return driver;
}

/** Marks Neo4j as currently unreachable so getNeo4jDriver() short-circuits. */
export function markNeo4jFailure(): void {
  lastFailureAt = Date.now();
}
