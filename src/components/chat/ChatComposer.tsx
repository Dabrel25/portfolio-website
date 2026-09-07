"use client";

import { useState } from "react";
import type { ChatStatus } from "./ChatPanel";

export default function ChatComposer({
  status,
  onAsk,
  autoFocus,
}: {
  status: ChatStatus;
  onAsk: (question: string, deepSearch: boolean) => void;
  autoFocus?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [deepSearch, setDeepSearch] = useState(false);
  const busy = status === "thinking";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || busy) return;
    onAsk(question.trim(), deepSearch);
    setQuestion("");
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
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

      <button
        type="button"
        onClick={() => setDeepSearch((v) => !v)}
        disabled={busy}
        title="A more in-depth search through the graph for specific questions — slower, but more thorough."
        className="flex items-center gap-2 self-start px-2 text-xs text-[#8a8878] disabled:opacity-40"
      >
        <span
          className={`relative inline-flex h-4 w-7 flex-none items-center rounded-full transition-colors ${
            deepSearch ? "bg-[#1f1e1b]" : "bg-[#e5e3d8]"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 flex-none translate-x-0.5 rounded-full bg-white transition-transform ${
              deepSearch ? "translate-x-3.5" : ""
            }`}
          />
        </span>
        <span className={deepSearch ? "text-[#1f1e1b]" : ""}>Deep search</span>
      </button>
    </div>
  );
}
