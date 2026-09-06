"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Timing model (all values in ms unless noted):
 * - CHAR_DELAY: time between each typed character, applied per line.
 * - LINE_PAUSES[i]: pause held after line i finishes typing, before line i+1 starts.
 *   Line 2's pause is deliberately longer than line 1's — it's the setup line
 *   before the payoff in line 3, so the beat needs more room to land.
 * - CURSOR_SETTLE_DELAY: after the last line finishes, how long the cursor
 *   keeps blinking before fading out.
 * - SCROLL_HINT_DELAY: idle time after the cursor settles before the
 *   "scroll down" affordance fades in.
 * With reduced motion, the initial typing collapses to an instant render (see
 * useReducedMotion branch below) — no typing timers. The two idle loops below
 * (retype and blur-pulse) are motion, not just initial reveal, so they're
 * gated separately and never run under reduced motion.
 *
 * Each line is a list of segments so specific words ("engineering",
 * "empowers") can carry their own emphasis style once fully typed, without
 * touching the char-by-char typing loop below — that loop only ever works
 * off each line's flattened plain text.
 *
 * "engineering" (emphasis "bold") is bold italic, static. The accent word
 * (initially "empowers") is italic and loops forever once typing finishes:
 * hold -> backspace -> retype as the next word in RETYPE_WORDS, in the next
 * palette color -> hold. Word and color advance together each cycle.
 */
type Segment = { text: string; emphasis?: "bold" | "accent" };
const LINES: Segment[][] = [
  [{ text: "Hey! I'm Darrel." }],
  [
    { text: "I am passionate about " },
    { text: "engineering", emphasis: "bold" },
    { text: " that " },
    { text: "empowers.", emphasis: "accent" },
  ],
  [{ text: "Let's chat." }],
];
const LINE_TEXT = LINES.map((segments) => segments.map((s) => s.text).join(""));
const CHAR_DELAY = 40;
const LINE_PAUSES = [400, 500];
const CURSOR_SETTLE_DELAY = 900;
const SCROLL_HINT_DELAY = 800;

const RETYPE_WORDS = ["empowers.", "transforms.", "unlocks.", "elevates.", "solves."];
const RETYPE_MAX_LEN = Math.max(...RETYPE_WORDS.map((w) => w.length));
const RETYPE_PALETTE = ["#d64545", "#4bb3a0", "#5b8def", "#e08a3e", "#9b6bd6"];
const RETYPE_HOLD_MS = 2500;
const RETYPE_ERASE_CHAR_MS = 25;
const RETYPE_TYPE_CHAR_MS = 50;

type TypingState = {
  lineIndex: number;
  charIndex: number;
  done: boolean;
};

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<TypingState>({ lineIndex: 0, charIndex: 0, done: false });
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [retype, setRetype] = useState({ wordIndex: 0, visible: RETYPE_WORDS[0].length, colorIndex: 0 });

  useEffect(() => {
    if (prefersReducedMotion !== false) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, delay);
      timeouts.push(id);
    };

    let elapsed = 0;
    LINE_TEXT.forEach((text, lineIndex) => {
      for (let charIndex = 1; charIndex <= text.length; charIndex++) {
        schedule(() => setState({ lineIndex, charIndex, done: false }), elapsed);
        elapsed += CHAR_DELAY;
      }
      if (lineIndex < LINE_TEXT.length - 1) {
        elapsed += LINE_PAUSES[lineIndex];
      }
    });
    schedule(() => setState((s) => ({ ...s, done: true })), elapsed);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [prefersReducedMotion]);

  const done = prefersReducedMotion === true || state.done;
  const lineIndex = prefersReducedMotion === true ? LINE_TEXT.length - 1 : state.lineIndex;
  const charIndex = prefersReducedMotion === true ? LINE_TEXT[LINE_TEXT.length - 1].length : state.charIndex;

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setShowScrollHint(true), CURSOR_SETTLE_DELAY + SCROLL_HINT_DELAY);
    return () => clearTimeout(timer);
  }, [done]);

  useEffect(() => {
    if (!done || prefersReducedMotion !== false) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = (wordIndex: number, colorIndex: number) => {
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        const currentWord = RETYPE_WORDS[wordIndex];
        const erase = (visible: number) => {
          if (cancelled) return;
          if (visible < 0) {
            const nextWord = (wordIndex + 1) % RETYPE_WORDS.length;
            const nextColor = (colorIndex + 1) % RETYPE_PALETTE.length;
            const nextText = RETYPE_WORDS[nextWord];
            const type = (v: number) => {
              if (cancelled) return;
              setRetype({ wordIndex: nextWord, visible: v, colorIndex: nextColor });
              if (v < nextText.length) {
                timeoutId = setTimeout(() => type(v + 1), RETYPE_TYPE_CHAR_MS);
              } else {
                loop(nextWord, nextColor);
              }
            };
            type(0);
            return;
          }
          setRetype((r) => ({ ...r, visible }));
          timeoutId = setTimeout(() => erase(visible - 1), RETYPE_ERASE_CHAR_MS);
        };
        erase(currentWord.length - 1);
      }, RETYPE_HOLD_MS);
    };

    loop(0, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [done, prefersReducedMotion]);

  return (
    <div className="relative flex h-full w-full flex-col items-start justify-center bg-[#faf8f5] px-6 text-left md:px-16">
      <div className="font-mono text-2xl text-[#1f1e1b] md:text-4xl">
        {LINES.map((segments, i) => {
          const lineText = LINE_TEXT[i];
          const isCurrentLine = i === lineIndex && !done;
          const isPastLine = i < lineIndex || done;
          const visibleChars = isPastLine ? lineText.length : isCurrentLine ? charIndex : 0;
          if (visibleChars === 0 && !isPastLine && !isCurrentLine) return null;

          const isActiveTypingLine = isCurrentLine || (i === lineIndex && done);
          let consumed = 0;
          return (
            <p key={lineText} className="min-h-[1.4em]">
              {segments.map((seg, segIndex) => {
                const segStart = consumed;
                consumed += seg.text.length;
                const segVisible = Math.min(Math.max(visibleChars - segStart, 0), seg.text.length);
                if (segVisible === 0) return null;
                const segComplete = segVisible === seg.text.length;

                const isRetyping = seg.emphasis === "accent" && done && prefersReducedMotion === false;
                const displayText = isRetyping ? RETYPE_WORDS[retype.wordIndex] : seg.text;
                const displayVisible = isRetyping ? retype.visible : segVisible;
                const accentColor = isRetyping ? RETYPE_PALETTE[retype.colorIndex] : "#d64545";

                if (seg.emphasis === "accent") {
                  return (
                    <span
                      key={segIndex}
                      className={`inline-block italic ${isRetyping ? "" : "transition-colors duration-500"}`}
                      style={{
                        color: segComplete ? accentColor : undefined,
                        width: isRetyping ? `${RETYPE_MAX_LEN}ch` : segComplete ? `${seg.text.length}ch` : undefined,
                        transition: isRetyping ? undefined : "color 500ms",
                      }}
                    >
                      {displayText.slice(0, displayVisible)}
                    </span>
                  );
                }

                if (seg.emphasis === "bold") {
                  return (
                    <span
                      key={segIndex}
                      className="italic"
                      style={{ fontWeight: segComplete ? 700 : 400, transition: "font-weight 300ms ease-out" }}
                    >
                      {seg.text.slice(0, displayVisible)}
                    </span>
                  );
                }

                return <span key={segIndex}>{seg.text.slice(0, displayVisible)}</span>;
              })}
              {isActiveTypingLine && (
                <span
                  className={`ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[2px] bg-[#1f1e1b] ${
                    done ? "animate-[fade-out_1.2s_ease-out_forwards]" : "animate-[blink_1s_step-end_infinite]"
                  }`}
                />
              )}
            </p>
          );
        })}
      </div>

      <motion.button
        type="button"
        aria-label="Scroll down to explore"
        onClick={() => window.scrollTo({ top: window.innerHeight * 2, behavior: "smooth" })}
        initial={{ opacity: 0, y: -4 }}
        animate={showScrollHint ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.6 }}
        className="absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0 text-[#8a8878] transition-colors hover:text-[#4a493f]"
      >
        {[0, 1, 2].map((i) => (
          <motion.svg
            key={i}
            width="30"
            height="30"
            viewBox="0 0 16 16"
            fill="none"
            className="-my-1"
            animate={{ y: [0, 10, 0], opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          >
            <path
              d="M2 5L8 11L14 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        ))}
      </motion.button>

      <style jsx>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        @keyframes fade-out {
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
