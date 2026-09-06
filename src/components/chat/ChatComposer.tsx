"use client";

import { useState } from "react";
import type { ChatStatus } from "./ChatPanel";

export default function ChatComposer({
  status,
  onAsk,
  autoFocus,
}: {
  status: ChatStatus;
  onAsk: (question: string) => void;
  autoFocus?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const busy = status === "thinking";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || busy) return;
    onAsk(question.trim());
    setQuestion("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 rounded-full border border-[#e5e3d8] bg-white px-4 py-2.5 shadow-sm">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask anything about me..."
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-sm text-[#1f1e1b] placeholder:text-[#a8a696] focus:outline-none"
        disabled={busy}
      />
      <button
        type="submit"
        disabled={busy || !question.trim()}
        className="rounded-full bg-[#1f1e1b] px-3 py-1 text-xs font-mono uppercase text-[#f5f4ed] disabled:opacity-40"
      >
        {status === "thinking" ? "…" : "Ask"}
      </button>
    </form>
  );
}
