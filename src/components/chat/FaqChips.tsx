"use client";

const FAQ_QUESTIONS = [
  "What are your Projects?",
  "Where did you last work?",
  "What languages and frameworks are you familiar with?",
  "What do you do in your free time?",
];

export default function FaqChips({ onAsk, disabled }: { onAsk: (question: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FAQ_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onAsk(question)}
          className="rounded-full border border-[#e5e3d8] bg-white/80 px-3 py-1.5 font-mono text-xs text-[#6b6a62] backdrop-blur transition-colors hover:border-[#1f1e1b] hover:bg-[#1f1e1b] hover:text-white disabled:opacity-40"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
