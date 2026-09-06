# Handoff #2 — 2026-09-01

Personal portfolio site. Next.js App Router, React 19, TypeScript, Tailwind
v4. Centerpiece is a 3D force-directed knowledge graph homepage
(`react-force-graph-3d` + Three.js + `d3-force-3d` physics), reached via a
scroll-triggered hero→graph transition, with an LLM chat feature that drives
graph navigation and a separate résumé page. **No commits exist in this repo
yet** — `git log` on `main` reports "does not have any commits yet"; every
file including `.claude/`, `src/`, configs, etc. is staged/untracked. Read
`HANDOFF_1.md` too — it predates this one and its "deferred fixed-position
layout" thread is still open (see Pending, item 3).

## Session summary (chronological)

This session's work, in order (all verified via `tsc --noEmit` + `eslint`
clean unless noted otherwise):

1. **Line color darkening** — graph edge lines made darker without changing
   their length.
2. **Fixed "← Graph" back-nav from résumé page** — was landing on the hero
   intro instead of the graph section; also moved the button to the left of
   the nav bar so its arrow doesn't visually point at unrelated nav items.
3. **Hero scroll-down indicator** — repositioned near-bottom-center, enlarged,
   made clickable (scrolls to `window.innerHeight * 2`), given a 3-chevron
   staggered trailing effect. Iterated twice more: removed the "Scroll" text
   label entirely (explicit instruction), then lightened/thinned the chevrons
   (color `#4a493f`→`#8a8878`, stroke width `2.5`→`1.5`) per "less dark and
   fat." **Done**, current code in `src/components/landing/Hero.tsx:218-247`.
4. **Résumé button clipping bug** — root-caused to a `scale` transform on the
   graph layer during the scroll crossfade in `LandingExperience.tsx`; fixed
   by removing the scale from that layer entirely.
5. **First-person chat voice + clickable node-mention links** — rewrote the
   system prompt in `src/app/api/chat/route.ts` to answer in first person
   ("I"/"my"/"me", never third person), and added `#node:id`-prefixed
   markdown links in chat answers that render as clickable buttons
   (`ChatMessage.tsx`/`ChatPanel.tsx`) navigating the graph to that node,
   validated against real node ids. **Done, verified end-to-end against the
   live API.**
6. **Persona voice doc — added then explicitly reverted.** A `persona.ts`
   voice profile was built from the user's own dictated speech patterns, then
   the user said response quality had gotten worse (longer, less natural) and
   asked to revert to "just...a generally warm but professional tone."
   Reverted in `route.ts`; **`src/data/persona.ts` is still on disk, unused,
   not deleted** — leave it alone unless asked.
7. **Resizable docked side-chat** — drag handle on the dock's left edge using
   Pointer Capture, default width increased slightly. Fully working; see Key
   Files below for current constants.
8. **FAQ chips** — added "What do you do in your free time?" (4th question)
   and changed hover state from a subtle border-darken to full color
   inversion (`hover:bg-[#1f1e1b] hover:text-white`). Confirmed current in
   `src/components/chat/FaqChips.tsx:3-8,19`.
9. **Invite headline typewriter — multiple rounds** (`InviteHeadline.tsx`):
   switched from 3 stacked static lines to a single-line type→hold→delete
   cycle through `PHRASES`; removed a third phrase ("Here's some questions to
   get you started...") per explicit instruction; enlarged "This is me." and
   lengthened its hold before deleting; fixed uneven spacing before the FAQ
   chips (a `min-h` that stayed reserved for 2-line wrap even once settled on
   1 line); fixed the cursor not following wrapped text on the second phrase
   (root cause: `<p>` was `flex`, making the cursor an independent flex
   sibling pinned to a fixed position regardless of wrap — fixed by nesting
   text+cursor in one inline `<span>` so normal text flow governs cursor
   position).
10. **Invite card sizing** — first asked to fix "blocks the diamond" by
    widening instead of heightening; then explicitly reverted to the original
    width but asked for no wasted vertical space *during* typing
    specifically. Final: small fixed-height card while typing
    (`INVITE_TYPING_HEIGHT`), expands to full height only once done
    (`INVITE_HEIGHT`), and the FAQ/composer block is conditionally rendered
    (`{headlineDone && (...)}`) rather than opacity-toggled, so it doesn't
    reserve layout space while hidden.
11. **"Résumé →" label fix** — was "Resume →" (read as the verb); fixed to
    "Résumé →" (French é) so it reads as the noun.
12. **Full-graph "wipe" reveal, triggered by the second invite phrase** — when
    "All my hobbies, milestones, my skills, my values — me." appears, every
    remaining node/edge in the graph reveals slowly, ordered ring-by-ring
    outward from the center node (BFS hop distance), not all at once. Built
    across `selection.ts` (`bfsRingsFromCenter`), `useGraphSelection.ts`
    (`revealAll`), `InviteHeadline.tsx` (new `onPhrase` callback prop, fired
    via a latest-ref pattern so a fresh closure each render doesn't retype
    the whole sequence), `GraphEngine3D.tsx` (`revealDelays` prop,
    `WIPE_ENTRANCE_MS = 1600` vs default `ENTRANCE_MS = 900`, extended re-fit
    delay), and `GraphView.tsx` (`WIPE_RING_DELAY_MS = 550`,
    `WIPE_NODE_JITTER_MS = 120`, `handleInvitePhrase` handler, `hasWipedRef`
    guard). **Done and verified.**
13. **Fog/zoom washout bug in the wipe reveal — found and fixed this
    session.** The wipe's `zoomToFit` needs to frame the *entire* graph
    (~90+ nodes incl. skills at the time), landing the camera at ~776-780
    world units from center — far outside the fixed fog range
    (`near=120, far=550`, later `far=800`) the scene had been hand-tuned at
    for a ~200-unit overview distance. `THREE.Fog` is linear, so at ~777
    units with `far=800` the fog factor was ~97% — the scene read as almost
    fully washed to the background color. **Fix**: replaced the one-shot
    `setInterval`-based fog setup in `GraphEngine3D.tsx` with a persistent
    `requestAnimationFrame` loop that recomputes `fog.near`/`fog.far` every
    frame from the *live* camera-to-target distance `d`:
    `near = Math.max(120, 0.6 * d)`, `far = Math.max(550, 2.75 * d)`. The
    `0.6`/`2.75` ratios are derived from the original hand-tuned values
    (120/200, 550/200); the `Math.max` floors reproduce the exact original
    tuning at normal distances (focused-node fly-to at d=90 never fogs;
    overview at d≈200 gets exactly 120/550 as before). Verified via
    Playwright screenshots at `d≈776.8` — scene now stays fully legible
    (nodes, edges, labels all visible) through and after the wipe. **Done and
    verified**, this is the most recent nontrivial fix.
14. **"When you see everything remove all skills"** — clarified via
    AskUserQuestion that this meant excluding Skills-category nodes from the
    *wipe reveal specifically* (not deleting them from the graph data — they
    remain reachable via chat/click as before). Implemented in
    `useGraphSelection.ts`'s `revealAll()`: builds a
    `Set` of node ids where `category === "skill"` from `graph.nodes` and
    filters them out of the flattened, ordered reveal list before calling
    `revealNodes`. **Done**, `tsc`/`eslint` clean. **Not yet re-verified via
    Playwright screenshot after this specific change** — the fog fix (#13)
    was screenshot-verified with skills still included in the wipe; this
    skills-exclusion edit came after that verification pass and has only
    been typechecked/linted, not visually confirmed. That's the one loose
    end from this session — see Pending #1.
15. **Created the `project-handoff` skill** (this very mechanism) at
    `.claude/skills/project-handoff/SKILL.md` — writes a numbered
    `HANDOFF_<N>.md` at the project root summarizing a session so a cleared
    chat can resume. Convention discovered mid-creation: this repo already
    had `HANDOFF_1.md` from an earlier, different session (node-selection/
    camera-framing work) — the skill was corrected to match that existing
    `HANDOFF_<N>.md`-at-root convention rather than the `handoffs/` subfolder
    initially assumed. This file (`HANDOFF_2.md`) is its first real output.

## Current architecture / key files

- **`src/data/graph.ts`** — `Graph`/`GraphNode`/`GraphEdge` types,
  `NodeCategory = "self" | "interest" | "skill" | "project" | "job" |
  "education" | "award" | "community"`, `buildGraph()`, and the hand-authored
  "identity/interest/community" seed nodes (Me + hobbies + community — ~8
  literal nodes here).
- **`src/data/graph-builders.ts`** — generates the rest of the graph
  (jobs/projects/education/skills/awards) from `src/data/resume.ts`'s
  structured resume data via `buildProfessionalNodes()`/
  `buildProfessionalEdges()`, one node per resume entry, ids slugified from
  company/project/school names.
- **`src/data/graph-full.ts`** — 4-line entry point:
  `graph = buildGraph(buildProfessionalNodes(), buildProfessionalEdges())`.
  This is the actual graph the app renders — import from here, not
  `graph.ts`, for the full node set.
- **`src/lib/graph/selection.ts`** — pure selection-state helpers:
  `initialSelection`, `selectNode`, `collapseToCenter`, `revealNodes`,
  `bfsRingsFromCenter` (BFS hop-distance rings from center, drives the wipe
  ordering), `shortestPath` (BFS path, drives chat-triggered camera walks),
  `isVisible`/`isLabeled`/`isFaded`/`isEdgeFaded`.
- **`src/lib/graph/useGraphSelection.ts`** — the hook wrapping the above;
  exposes `{ selection, select, clear, collapse, introRevealed,
  revealCategory, revealAll }`. `revealAll()` is the wipe trigger — now
  skill-filtered (see summary #14).
- **`src/components/graph/GraphEngine3D.tsx`** — the actual Three.js/
  react-force-graph-3d render layer. Key constants: `ENTRANCE_MS = 900`,
  `WIPE_ENTRANCE_MS = 1600`. Key mechanisms: `bornAtRef` (per-node entrance
  timestamp map, consulted by an rAF scale-in loop), `revealDelays` prop
  (optional per-node extra stagger delay, keyed by id, used by the wipe),
  the new persistent per-frame fog rAF loop (see summary #13), a zoom clamp
  (`controls.maxDistance = 900`), a fixed `OVERVIEW_CAMERA_POSITION = {x:0,
  y:0, z:271}` / `OVERVIEW_LOOKAT` pose used both for the initial load fit
  and a `resetCameraSignal` prop (increment to fly back to overview — wired
  to the "↺ Overview" button). Also has a left-framing camera swivel and
  `handleEngineStop` fx/fy/fz position-freeze effect from the HANDOFF_1
  session (see Drift below) — these are pre-existing, not new this session.
- **`src/components/graph/GraphView.tsx`** — top-level page section wiring
  chat, invite headline, FAQ chips, and `GraphEngine3D` together. Key
  constants: `WIPE_RING_DELAY_MS = 550`, `WIPE_NODE_JITTER_MS = 120`,
  `DEFAULT_DOCK_WIDTH = 380`, `MIN_DOCK_WIDTH = 280`, `MAX_DOCK_WIDTH = 560`,
  `CENTERED_WIDTH = 480`, `INVITE_TYPING_HEIGHT = 130`,
  `INVITE_HEIGHT = 220`, `CARD_HEIGHT = 320`. Also carries `?debugCoords=1`
  URL-param-gated dev tooling (`DebugCoordsOverlay`, `CameraDebugInfo`) — not
  authored by me, appeared out-of-band, useful for future camera/fog
  debugging.
- **`src/components/chat/InviteHeadline.tsx`** — the type→hold→delete
  headline. `PHRASES` (2 phrases now: "This is me." bold, then "All my
  hobbies, milestones, my skills, my values — me." which is also the wipe
  trigger, no third phrase). Fires `onPhrase(phraseIndex)` at the start of
  each phrase's typing, via a ref-latest-callback pattern to avoid retyping
  on every parent re-render.
- **`src/app/api/chat/route.ts`** — chat API route. `SYSTEM_PROMPT` is the
  simple first-person/warm-professional-tone version (persona.ts NOT
  imported here anymore).
- **`.claude/skills/project-handoff/SKILL.md`** — this handoff mechanism,
  created this session.

## In-progress / unresolved work

**Nothing is actively broken right now** — the one open loose end is
verification, not implementation:

1. The skills-exclusion-from-wipe change (summary #14,
   `useGraphSelection.ts`'s `revealAll()`) has only been `tsc`/`eslint`
   checked, not re-screenshotted. Recommended next step: re-run the same
   Playwright wipe-check pattern used for the fog fix (scroll to
   `window.innerHeight * 2`, wait through the invite sequence, screenshot at
   the point the second phrase appears and after) and confirm visually that
   no triangle/diamond-shaped Skills-category nodes appear during the
   auto-wipe, while still confirming a Skills node **is** reachable normally
   (e.g. ask the chat "what languages and frameworks are you familiar
   with?" — the existing FAQ chip — and confirm it still reveals/navigates
   to a skill node via the pre-existing `revealCategory` path, which was
   NOT touched and has no skill filter).

No other unresolved bugs from this session. The nondeterministic
`three-forcegraph` crash documented in HANDOFF_1 (`Cannot read properties of
undefined (reading 'tick')`, blanks the canvas permanently, ~1-in-3-5 node
clicks under Playwright automation) was never revisited this session —
assume it's still present and unfixed unless proven otherwise.

## Verified working

- Line darkening, back-nav fix + button reposition, chevron trail +
  lightening, résumé-button clipping fix, first-person chat + clickable
  node links (live API), persona revert, resizable dock, FAQ chip
  addition + hover inversion, invite headline phrase/timing/sizing fixes
  (cursor-follow, spacing, small-then-expand card), "Résumé →" label.
- Full-graph wipe reveal mechanics (BFS ring ordering, per-ring stagger,
  entrance duration override) — screenshot-verified.
- Fog/zoom washout fix — screenshot-verified at camera distance ≈776.8,
  scene stays legible throughout and after the wipe.
- All of the above are also `tsc --noEmit` / `eslint .` clean.

## User preferences / drift to respect

- **Persona/voice**: user explicitly rejected a detailed "speak like me"
  persona profile after finding it made responses worse (longer, less
  natural). Current instruction is deliberately simple: "generally warm but
  professional tone," first person. Do not reintroduce a heavier persona
  system unless the user asks again.
- **No "Scroll" text label** on the hero's scroll indicator — explicit,
  emphatic rejection ("DON'T pUT the words scroll!"). Icon-only is
  intentional, not an oversight.
- **Chevron/arrow styling**: user wants it noticeably lighter/thinner than a
  first pass tends to produce — went through two rounds of "bolder" then
  "less dark and fat." Current state (`#8a8878`, stroke-width 1.5) is the
  settled preference.
- **Invite card sizing**: user rejected "grow the card taller" (blocks the
  diamond node) in favor of "grow narrower/width," then on the *next* round
  reversed that specific preference back to the original width but wanted
  the *typing-phase* footprint minimized instead — these look contradictory
  out of context but are actually sequential refinements of the same intent
  (don't block the diamond, don't waste space) landing on different
  mechanisms (width vs. height vs. two-stage sizing) each time. Read as
  "iterating toward the right mechanism," not as user indecision.
  Current: small-height card while typing, expand once done.
  Do not re-litigate a width-vs-height debate — the two-stage-height
  solution now in place already reconciled it.
  **Related to**: `HANDOFF_1.md`'s note that a "consistent, fixed node
  layout" was the flagged next priority after HANDOFF_1 — that thread
  appears to have been superseded/deprioritized by this session's run of UI
  polish requests rather than continued. If the user brings it up again,
  HANDOFF_1 already has the relevant research (d3-force-3d fx/fy/fz
  API, ~46-node/8-category count as of that session, entrance-jitter and
  zoomToFit systems that would need reconciling) — don't redo that research.
- **Skills exclusion is reveal-scope-only, not data deletion** — confirmed
  explicitly via AskUserQuestion this session. If a future request says
  something like "remove skills" again, re-clarify scope the same way;
  don't assume it means deleting the category from the data model.
- User gives very direct, specific corrections rather than vague feedback —
  when something is fixed, it tends to be genuinely settled; no need to
  hedge or re-ask about already-resolved rounds of iteration above.

## Pending / next tasks

Explicitly asked for, not yet fully done:

1. **Re-verify the skills-exclusion wipe change visually** (Playwright
   screenshot), per "In-progress / unresolved work" above. This is the only
   concrete unfinished item from this session.

Not asked for, but flagged as open threads a user might return to:

2. The pre-existing nondeterministic `three-forcegraph` crash from
   HANDOFF_1 — never revisited this session, still presumed present.
3. HANDOFF_1's "fixed/deterministic node world-position layout" (distinct
   from the *camera* fixed-overview-pose work that has since landed) —
   flagged there as the immediate next priority, but this session's actual
   thread of work went a different direction (chat/UI/wipe polish) instead.
   Only pick this up if the user explicitly asks — don't assume it's still
   wanted just because HANDOFF_1 flagged it.

## Environment notes

- Dev server runs on **port 3000**; check with
  `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000` before
  assuming it needs starting.
- **Playwright is not a project devDependency** — `npx playwright` /
  `import "playwright"` fails cold in a fresh shell. Working pattern used
  this session: `cd` into a scratch dir (e.g. the job's tmp dir), `npm init
  -y && npm install playwright-core playwright`, then `npx playwright
  install chromium` (browsers are usually already cached under
  `~/Library/Caches/ms-playwright/`, so this is fast) — run scripts from
  that scratch dir with plain `node script.mjs`, not from the project root.
- The `?debugCoords=1` URL param + `DebugCoordsOverlay` component (appeared
  out-of-band, not authored by me) is the fastest way to read live camera
  position/lookAt/fov/distance during manual or Playwright-driven testing —
  reuse it rather than re-adding console-log-based camera debugging.
- `rtk` (a token-optimizing CLI proxy) is hooked into shell commands
  globally per the user's `~/.claude/RTK.md` — some raw command output
  (e.g. `ls`) comes back reformatted with byte-count summaries; don't
  naively pipe its output through additional `grep`/regex expecting raw
  shell output shape (bit me once this session — a `ls | grep -oE
  '[0-9]+'` picked up digits from RTK's own formatting, not filenames; fixed
  by using a glob-safe loop instead).
- This repo has **zero commits** — everything is uncommitted. Don't assume
  `git log`/`git blame` will tell you anything; there's no history to lean
  on yet.

## Prompt to resume with

```
Continuing work on the PortfolioWebsite knowledge-graph portfolio site.
Read HANDOFF_2.md (and HANDOFF_1.md for one still-open older thread) in the
project root for full context. HANDOFF_2 covers a long run of UI/UX polish
(hero scroll indicator, invite headline typewriter, chat voice, resizable
dock, FAQ chips) culminating in a full-graph "wipe" reveal feature and a
fog/zoom washout bug that was found and fixed in it, plus a just-added
skills-exclusion-from-wipe change.

One concrete loose end to pick up first: the skills-exclusion change in
useGraphSelection.ts's revealAll() (filters category === "skill" node ids
out of the wipe's reveal list) has only been tsc/eslint-checked, not
visually verified. Re-run a Playwright pass: scroll to the graph section,
let the invite headline reach its second phrase ("All my hobbies,
milestones..."), screenshot during and after the wipe, and confirm no
Skills-category (diamond/triangle icon per the legend — check
src/components/chat/FaqChips.tsx's sibling legend component for the actual
shape/color mapping) nodes appear automatically, while confirming a skill
node is still reachable via the existing "What languages and frameworks are
you familiar with?" FAQ chip (that path uses revealCategory, not revealAll,
and was not touched by the filter).

Don't restart research on HANDOFF_1's still-open "fixed/deterministic node
world-position layout" thread unless the user explicitly brings it up again
— it was flagged as a priority there but this session's actual work went a
different direction instead.
```
