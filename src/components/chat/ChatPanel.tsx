"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import ChatMessage, { type ChatTurn } from "./ChatMessage";
import ChatComposer from "./ChatComposer";

export type ChatStatus = "idle" | "thinking" | "error";

export default function ChatPanel({
  status,
  turns,
  onAsk,
  onNodeClick,
}: {
  status: ChatStatus;
  turns: ChatTurn[];
  onAsk: (question: string) => void;
  onNodeClick?: (nodeId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "thinking";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex h-full w-full flex-col border-l border-[#e5e3d8] bg-white/80 backdrop-blur-md"
    >
      <div className="border-b border-[#e5e3d8] px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-widest text-[#8a8878]">Ask about me</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {turns.length === 0 && (
          <p className="text-sm leading-relaxed text-[#8a8878]">
            Ask a question — the graph will navigate to relevant nodes as it answers.
          </p>
        )}
        {turns.map((turn, i) => (
          <ChatMessage key={i} turn={turn} onNodeClick={onNodeClick} />
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-[#f0efe6] px-4 py-3 text-sm text-[#8a8878]">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#e5e3d8] p-4">
        <ChatComposer status={status} onAsk={onAsk} />
      </div>
    </motion.div>
  );
}
