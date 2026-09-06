---
name: project-handoff
description: Writes a numbered handoff_md file summarizing the current chat session's full context (what's done, what's pending, in-flight bugs, decisions, drift) so a fresh chat can read it and continue seamlessly after /clear. Use when the user asks to "hand off", "write a handoff", or wants to clear the chat and resume later.
---

# Project Handoff

Produces a single self-contained markdown file that lets a brand-new chat
(zero prior context) pick up exactly where this session left off. The user's
workflow is: invoke this skill -> `/clear` -> in the new chat, point Claude at
the handoff file -> Claude reads it and continues without re-asking anything
the file already answers.

## Where it goes

Write to `HANDOFF_<N>.md` directly at the project root (this matches the
existing convention already in use in this repo — check for
`HANDOFF_*.md` files at the root before assuming N=1). Before writing:

```bash
for f in HANDOFF_*.md; do [ -e "$f" ] && echo "$f"; done | grep -oE 'HANDOFF_[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
```

(Use a glob-safe loop, not `ls | grep -oE '[0-9]+'` directly — some shell
wrappers/hooks reformat `ls` output with byte counts etc. that also contain
digits and will corrupt a naive grep.)

Increment that number by 1 (start at 1 if no `HANDOFF_*.md` files exist yet).
Never overwrite an existing handoff file; each one is a permanent snapshot in
time, not a rolling doc.

## What to gather before writing

Do NOT just summarize from memory. Actively verify current state so the
handoff reflects reality, not stale assumptions:

- `git status` and `git diff` (or `git diff HEAD` if things are staged) —
  the actual uncommitted state, not what you remember editing.
- `git log --oneline -15` — recent commit history for context on what's
  already landed vs. still uncommitted.
- Re-read any file you're about to describe as "currently in state X" if
  there's any chance it changed since you last touched it (out-of-band edits
  happen in this repo — check for them rather than assuming your last edit is
  still the current content).
- If there's an in-progress bug or unverified feature, note its exact last-
  known state (last test run, last screenshot, last error) rather than a
  vague "should be working."

## Required sections

Write the handoff file with these sections, in this order. Be concrete and
specific — file paths with line numbers, exact variable/function names, exact
values (not "some timing constants" but the actual numbers). A fresh Claude
reading this has NO other context; anything you gesture at vaguely is
information that's lost.

1. **Header** — handoff number, date, one-line project description (this is
   a personal portfolio site: Next.js/React/TypeScript/Tailwind v4, built
   around an interactive 3D force-directed knowledge graph homepage using
   react-force-graph-3d/Three.js, a scroll-triggered hero->graph transition,
   an LLM chat feature, and a resume page — adjust if the project has moved
   on from this description by the time you write it).

2. **Session summary (chronological)** — every distinct request handled this
   session, in order, each as a short bullet: what was asked, what was done,
   whether it's fully done/verified or still in progress.

3. **Current architecture / key files** — the files most relevant to recent
   work and what each one is responsible for. Not a full repo map — just
   what's load-bearing for picking up the current thread(s).

4. **In-progress / unresolved work** — the most important section. For each
   open thread: exact current state, what's been tried, what failed and why
   (with real error messages/numbers if applicable), and the most likely next
   step. If you have a concrete recommendation, state it directly rather than
   listing options neutrally.

5. **Verified working** — features/fixes from this session that were
   actually tested (Playwright, manual check, tsc/eslint) and confirmed
   good, so the new session doesn't waste time re-verifying or re-litigating
   settled decisions.

6. **User preferences / drift to respect** — non-obvious standing
   instructions the user gave this session that a fresh Claude wouldn't infer
   from the code alone (e.g. reverted decisions and why, explicit style
   preferences, things explicitly rejected). This is what prevents the new
   session from re-proposing something the user already said no to.

7. **Pending/next tasks** — an explicit ordered list of what to do next,
   distinguishing "the user asked for this and it's not done yet" from
   "logical follow-up I'd suggest but wasn't asked for."

8. **Environment notes** — anything about the dev/tooling setup a fresh
   session would otherwise waste time rediscovering (e.g. dev server already
   running on port 3000, Playwright needing a project-local install because
   it's not a devDependency, any global CLI quirks like the `rtk` hook, etc).

## Style

- No filler, no restating things the file itself makes obvious. Dense and
  scannable over prose.
- Prefer exact code snippets (short, targeted) over descriptions of code when
  the exact shape matters (timing constants, function signatures, the exact
  current text of a prompt/constant).
- Do not editorialize about how the session went — this is a technical
  handoff document, not a retrospective.

## After writing

Tell the user the handoff file's path and number, and that they can `/clear`
and point the next session at it (e.g. "read handoffs/handoff_3.md and
continue"). Do not `/clear` for them — that's their action to take.
