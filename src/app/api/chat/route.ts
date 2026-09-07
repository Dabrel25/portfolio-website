import { NextRequest, NextResponse } from "next/server";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { Neo4jError } from "neo4j-driver";
import { graph } from "@/data/graph-full";
import { checkRateLimit } from "@/lib/rateLimit";
import { getNeo4jDriver, markNeo4jFailure } from "@/lib/neo4j";

const MAX_QUESTION_LENGTH = 500;
const MAX_TOOL_ITERATIONS = 4;
const MAX_RESULT_RECORDS = 50;

const nodeIds = graph.nodes.map((n) => n.id) as [string, ...string[]];

const AnswerSchema = z.object({
  targetNodeId: z
    .enum(nodeIds)
    .describe("The single graph node id most relevant to the question."),
  answer: z
    .string()
    .describe(
      "A concise answer to the visitor's question, written in the first person as Darrel himself (\"I\", \"my\"), grounded only in the data returned by the query_graph tool. Every time a graph node is mentioned by name, wrap it as a markdown link in the exact form [label](#node:exact-node-id), using a real id from the graph — e.g. \"I studied at [Waseda University](#node:waseda-university).\""
    ),
});

// Blocks any write/procedure keyword before a query ever reaches Neo4j. The
// database user this driver connects as should also be read-only — this is
// defense in depth, not the only guard.
const WRITE_KEYWORD_PATTERN =
  /\b(CREATE|MERGE|DELETE|DETACH|SET|REMOVE|DROP|LOAD\s+CSV)\b|CALL\s+apoc\./i;

// If Neo4j is unreachable or unconfigured, fall back to answering from the
// static in-memory graph (src/data/graph-full.ts) instead of failing the
// request — this is the same data Neo4j is seeded from (scripts/seed-neo4j.ts).
function staticGraphFallback(): string {
  return JSON.stringify({
    note:
      "Neo4j is unavailable — answering from the static graph mirror instead. " +
      "This is the full graph; ignore your query and read directly from it.",
    nodes: graph.nodes,
    edges: graph.edges,
  });
}

async function runCypherQuery(query: string): Promise<string> {
  if (WRITE_KEYWORD_PATTERN.test(query)) {
    return JSON.stringify({
      error: "Query rejected: only read queries are permitted.",
    });
  }

  let session;
  try {
    session = getNeo4jDriver().session({ defaultAccessMode: "READ" });
  } catch (error) {
    console.error("neo4j unavailable, falling back to static graph", error);
    return staticGraphFallback();
  }

  try {
    const result = await session.executeRead((tx) => tx.run(query));
    const records = result.records.slice(0, MAX_RESULT_RECORDS).map((record) => {
      const row: Record<string, unknown> = {};
      for (const key of record.keys) {
        row[key as string] = record.get(key);
      }
      return row;
    });
    return JSON.stringify({
      records,
      truncated: result.records.length > MAX_RESULT_RECORDS,
    });
  } catch (error) {
    if (error instanceof Neo4jError && error.code === "ServiceUnavailable") {
      console.error("neo4j unreachable, falling back to static graph", error);
      markNeo4jFailure();
      return staticGraphFallback();
    }
    return JSON.stringify({
      error: error instanceof Error ? error.message : "Query failed.",
    });
  } finally {
    await session.close();
  }
}

const queryGraphTool = tool(
  async ({ query }) => runCypherQuery(query),
  {
    name: "query_graph",
    description:
      `Run a read-only Cypher query against the Neo4j graph of Darrel's knowledge graph. ` +
      `Every node has label :Node plus one of Person/Hobby/Skill/Project/Job/Education/Award/Community, ` +
      `and properties id/name/category/layer/description/link. Relationships have dynamic types ` +
      `(e.g. BUILT_AT, USED) and a "label" property with the original human-readable text. ` +
      `Only MATCH/RETURN/WHERE-style read queries are allowed — write and procedure calls are rejected. ` +
      `Always RETURN specific properties (e.g. n.id, n.name) rather than whole nodes when possible. ` +
      `If Neo4j is unavailable, the tool instead returns the full graph as {nodes, edges} — read that directly.`,
    schema: z.object({
      query: z.string().describe("A read-only Cypher query."),
    }),
  }
);

const BASE_SYSTEM_PROMPT = `You are Darrel Ethan Ong, answering questions from a visitor to your portfolio's interactive knowledge graph, speaking as yourself in the first person ("I", "my", "me") — never in the third person and never "on behalf of" Darrel. Use a generally warm but professional tone.

Never invent facts, and never name or describe any real individual beyond the roles already present in the graph (e.g. "mentor", "collaborator").

Always pick exactly one node id that best represents the answer's subject — this is used to drive a camera animation, so it must be a real id from the graph, not invented.

Whenever your answer mentions something that corresponds to a graph node (a job, project, skill, hobby, award, etc.), wrap that mention as a markdown link in the exact form [label](#node:exact-node-id), where exact-node-id is a real id from the graph — e.g. "I studied at [Waseda University](#node:waseda-university)." These links let the visitor click through to that part of the graph, so use them generously for every node you reference, not just the single target node above. Never invent an id that isn't in the graph data.

Some nodes have an "images" field with file paths — these are rendered separately in the UI. Never mention filenames, paths, or the word "image" in your answer text; just answer the question naturally.`;

// Default path: the whole graph is small enough to hand over directly, so
// one structured-output call answers immediately — no Neo4j round trip.
const STATIC_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

You will be given the full graph as JSON (nodes with id/layer/category/label/description/meta, edges with source/target/label). Answer the visitor's question using ONLY this data.

Graph data:
${JSON.stringify(graph)}`;

// Deep search path: Claude queries Neo4j directly via the query_graph tool
// instead of receiving the graph inlined — slower, but lets it explore more
// specifically (multi-hop relationships, filtered lookups) for harder
// questions than a single inlined snapshot answers well.
const DEEP_SEARCH_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Your knowledge graph lives in Neo4j. Use the query_graph tool to look up whatever facts you need to answer the visitor's question. Run as many queries as you need before answering — pick the node id from a real "id" property value you have seen from a query result.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chat is not configured yet — ANTHROPIC_API_KEY is missing." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const question = body?.question;
  const deepSearch = body?.deepSearch === true;
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Question is too long — keep it under ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "This chat has hit its usage limit for now — check out the resume at /resume, or reach out directly at darrelethanong@gmail.com.",
      },
      { status: 429 }
    );
  }

  try {
    const llm = new ChatAnthropic({
      model: "claude-sonnet-5",
      maxTokens: 1024,
      outputConfig: { effort: "low" },
    });

    let result: z.infer<typeof AnswerSchema>;

    if (!deepSearch) {
      const structuredLlm = llm.withStructuredOutput(AnswerSchema);
      result = await structuredLlm.invoke([
        ["system", STATIC_SYSTEM_PROMPT],
        ["human", question],
      ]);
    } else {
      const llmWithTools = llm.bindTools([queryGraphTool]);

      const messages: BaseMessage[] = [];
      let response: AIMessage = await llmWithTools.invoke([
        ["system", DEEP_SEARCH_SYSTEM_PROMPT],
        ["human", question],
      ]);
      messages.push(response);

      let iterations = 0;
      while (response.tool_calls && response.tool_calls.length > 0) {
        if (iterations >= MAX_TOOL_ITERATIONS) {
          return NextResponse.json(
            { error: "Failed to answer question." },
            { status: 500 }
          );
        }
        iterations += 1;

        for (const toolCall of response.tool_calls) {
          const query = (toolCall.args as { query: string }).query;
          const toolResult = await runCypherQuery(query);
          messages.push(
            new ToolMessage({ content: toolResult, tool_call_id: toolCall.id ?? "" })
          );
        }

        response = await llmWithTools.invoke([
          ["system", DEEP_SEARCH_SYSTEM_PROMPT],
          ["human", question],
          ...messages,
        ]);
        messages.push(response);
      }

      const draftAnswer =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      const structuredLlm = llm.withStructuredOutput(AnswerSchema);
      result = await structuredLlm.invoke([
        ["system", DEEP_SEARCH_SYSTEM_PROMPT],
        [
          "human",
          `The visitor asked: "${question}"\n\nHere is your drafted answer based on the graph data you looked up:\n\n${draftAnswer}\n\nNow output it in the required structured format.`,
        ],
      ]);
    }

    const targetNode = graph.nodes.find((n) => n.id === result.targetNodeId);
    const images = targetNode?.images ?? [];

    return NextResponse.json({ ...result, images });
  } catch (error) {
    console.error("chat route error", error);
    return NextResponse.json({ error: "Failed to answer question." }, { status: 500 });
  }
}
