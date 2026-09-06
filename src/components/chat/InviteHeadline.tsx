"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Single-line type -> hold -> delete sequence, cycling through PHRASES.
 * Every phrase but the last types in, holds, then erases before the next
 * one types. The last phrase types in and stays (no erase) — onDone fires
 * once it's done typing plus a short cursor-settle beat, which the caller
 * uses to gate the FAQ chips / composer fade-in.
 */
const PHRASES: { text: string; bold?: boolean }[] = [
  { text: "This is me.", bold: true },
  { text: "All my hobbies, milestones, my skills, my values — me." },
  { text: "Ask anything about me." },
];
const CHAR_TYPE_DELAY = 28;
const CHAR_ERASE_DELAY = 14;
const HOLD_MS = 2200;
const CURSOR_SETTLE_DELAY = 300;

type Phase = "typing" | "holding" | "erasing";
type TypingState = { phraseIndex: number; visibleChars: number; phase: Phase; done: boolean };

export default function InviteHeadline({
  active,
  onDone,
  onPhrase,
}: {
  active: boolean;
  onDone: () => void;
  onPhrase?: (phraseIndex: number) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<TypingState>({
    phraseIndex: 0,
    visibleChars: 0,
    phase: "typing",
    done: false,
  });
  // Ref so the typing effect's identity doesn't depend on the caller's
  // onPhrase closure — GraphView passes a fresh arrow fn each render, which
  // would otherwise retype the whole sequence from scratch on every render.
  // Updated via effect (not during render) per this codebase's ref-write rule.
  const onPhraseRef = useRef(onPhrase);
  useEffect(() => {
    onPhraseRef.current = onPhrase;
  });

  useEffect(() => {
    // Don't start typing until the invite is actually visible — GraphView
    // mounts underneath the hero well before the scroll-crossfade reveals
    // it, so gating on mount alone would burn the whole sequence off-screen
    // before the visitor ever scrolls down to see it.
    if (!active) return;
    // Mirrors Hero.tsx's typing effect: skip entirely unless we know for sure
    // motion isn't reduced. The reduced-motion case is derived below at
    // render time instead of set here.
    if (prefersReducedMotion !== false) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      timeouts.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, delay)
      );
    };

    let elapsed = 0;
    PHRASES.forEach((phrase, phraseIndex) => {
      const isLast = phraseIndex === PHRASES.length - 1;

      schedule(() => onPhraseRef.current?.(phraseIndex), elapsed);

      for (let visibleChars = 1; visibleChars <= phrase.text.length; visibleChars++) {
        schedule(() => setState({ phraseIndex, visibleChars, phase: "typing", done: false }), elapsed);
        elapsed += CHAR_TYPE_DELAY;
      }

      if (isLast) return;

      elapsed += HOLD_MS;
      schedule(() => setState({ phraseIndex, visibleChars: phrase.text.length, phase: "holding", done: false }), elapsed);

      for (let visibleChars = phrase.text.length - 1; visibleChars >= 0; visibleChars--) {
        schedule(() => setState({ phraseIndex, visibleChars, phase: "erasing", done: false }), elapsed);
        elapsed += CHAR_ERASE_DELAY;
      }
    });

    schedule(
      () =>
        setState({
          phraseIndex: PHRASES.length - 1,
          visibleChars: PHRASES[PHRASES.length - 1].text.length,
          phase: "holding",
          done: true,
        }),
      elapsed
    );

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [active, prefersReducedMotion]);

  const done = active && (prefersReducedMotion === true || state.done);
  const lastPhrase = PHRASES[PHRASES.length - 1];
  const phrase = prefersReducedMotion === true ? lastPhrase : PHRASES[state.phraseIndex];
  const visibleChars = prefersReducedMotion === true ? lastPhrase.text.length : state.visibleChars;

  // Fires onDone exactly once, CURSOR_SETTLE_DELAY after `done` first becomes
  // true — a response to a derived boolean changing, not a synchronous
  // setState-of-the-parent inside the typing effect above.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(onDone, CURSOR_SETTLE_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Reduced motion skips the typing effect (and its per-phrase onPhrase
  // calls) entirely, jumping straight to the last phrase — still fire
  // onPhrase for every phrase once so callers depending on it (the graph
  // reveal) still happen, just without the char-by-char animation.
  useEffect(() => {
    if (!(active && prefersReducedMotion === true)) return;
    PHRASES.forEach((_, i) => onPhraseRef.current?.(i));
  }, [active, prefersReducedMotion]);

  return (
    <p
      className={`mx-auto flex max-w-sm items-center justify-center text-center font-mono leading-relaxed text-[#4a493f] ${
        done ? "min-h-[1.4em]" : "min-h-[2.8em]"
      } ${phrase.bold ? "text-xl" : "text-lg"}`}
    >
      {/* Plain inline flow (not flex) so the cursor wraps as part of the text
          itself and lands right after the last character, even when the
          phrase wraps to a second line — a flex sibling here would just pin
          itself to one side regardless of where the text actually wraps. */}
      <span>
        <span className={phrase.bold ? "font-bold text-[#1f1e1b]" : undefined}>
          {phrase.text.slice(0, visibleChars)}
        </span>
        {!done && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[2px] bg-[#1f1e1b] align-middle"
          />
        )}
      </span>
    </p>
  );
}
