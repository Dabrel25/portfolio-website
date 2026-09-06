"use client";

import ReactMarkdown from "react-markdown";
import { graph } from "@/data/graph-full";

export type ChatTurn = {
  question: string;
  answer: string | null;
  images?: string[];
  isError?: boolean;
};

const NODE_IDS = new Set(graph.nodes.map((n) => n.id));
const NODE_LINK_PREFIX = "#node:";

export default function ChatMessage({
  turn,
  onNodeClick,
}: {
  turn: ChatTurn;
  onNodeClick?: (nodeId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#ece9dc] px-4 py-2 text-sm text-[#1f1e1b]">
          {turn.question}
        </p>
      </div>
      {turn.answer && (
        <div className="flex justify-start">
          <div
            className={`max-w-[92%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed ${
              turn.isError
                ? "bg-red-50 text-red-700"
                : "bg-white text-[#33322c] shadow-sm"
            }`}
          >
            <div className="prose-chat">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[#1f1e1b]">{children}</strong>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  a: ({ href, children }) => {
                    if (href?.startsWith(NODE_LINK_PREFIX)) {
                      const nodeId = href.slice(NODE_LINK_PREFIX.length);
                      if (!NODE_IDS.has(nodeId)) return <>{children}</>;
                      return (
                        <button
                          type="button"
                          onClick={() => onNodeClick?.(nodeId)}
                          className="font-medium text-[#5b8def] underline decoration-[#5b8def]/40 underline-offset-2 hover:text-[#3a6bd0]"
                        >
                          {children}
                        </button>
                      );
                    }
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-[#1f1e1b]"
                      >
                        {children}
                      </a>
                    );
                  },
                  code: ({ children }) => (
                    <code className="rounded bg-[#f0efe6] px-1 py-0.5 font-mono text-xs">
                      {children}
                    </code>
                  ),
                }}
              >
                {turn.answer}
              </ReactMarkdown>
            </div>
            {!!turn.images?.length && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {turn.images.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
