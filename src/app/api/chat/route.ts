import { NextRequest, NextResponse } from "next/server";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { graph } from "@/data/graph-full";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_QUESTION_LENGTH = 500;

const nodeIds = graph.nodes.map((n) => n.id) as [string, ...string[]];

const AnswerSchema = z.object({
  targetNodeId: z
    .enum(nodeIds)
    .describe("The single graph node id most relevant to the question."),
  answer: z
    .string()
    .describe(
      "A concise answer to the visitor's question, written in the first person as Darrel himself (\"I\", \"my\"), grounded only in the graph data provided. Every time a graph node is mentioned by name, wrap it as a markdown link in the exact form [label](#node:exact-node-id), using a real id from the provided node list — e.g. \"I studied at [Waseda University](#node:waseda-university).\""
    ),
});

const SYSTEM_PROMPT = `You are Darrel Ethan Ong, answering questions from a visitor to your portfolio's interactive knowledge graph, speaking as yourself in the first person ("I", "my", "me") — never in the third person and never "on behalf of" Darrel. Use a generally warm but professional tone.

You will be given the full graph as JSON (nodes with id/layer/category/label/description/meta, edges with source/target/label). Answer the visitor's question using ONLY this data — never invent facts, and never name or describe any real individual beyond the roles already present in the graph (e.g. "mentor", "collaborator").

Always pick exactly one node id (from the provided node ids) that best represents the answer's subject — this is used to drive a camera animation, so it must be a real id from the graph, not invented.

Whenever your answer mentions something that corresponds to a graph node (a job, project, skill, hobby, award, etc.), wrap that mention as a markdown link in the exact form [label](#node:exact-node-id), where exact-node-id is a real id from the provided node list — e.g. "I studied at [Waseda University](#node:waseda-university)." These links let the visitor click through to that part of the graph, so use them generously for every node you reference, not just the single target node above. Never invent an id that isn't in the graph data.

Some nodes have an "images" field with file paths — these are rendered separately in the UI. Never mention filenames, paths, or the word "image" in your answer text; just answer the question naturally.

Graph data:
${JSON.stringify(graph)}`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chat is not configured yet — ANTHROPIC_API_KEY is missing." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const question = body?.question;
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
    const structuredLlm = llm.withStructuredOutput(AnswerSchema);

    const result = await structuredLlm.invoke([
      ["system", SYSTEM_PROMPT],
      ["human", question],
    ]);

    const targetNode = graph.nodes.find((n) => n.id === result.targetNodeId);
    const images = targetNode?.images ?? [];

    return NextResponse.json({ ...result, images });
  } catch (error) {
    console.error("chat route error", error);
    return NextResponse.json({ error: "Failed to answer question." }, { status: 500 });
  }
}
