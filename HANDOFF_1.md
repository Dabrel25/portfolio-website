# Handoff — Knowledge-graph node selection UI

## Where things stand

This is a Next.js App Router portfolio site with a 3D knowledge-graph
(`react-force-graph-3d` + Three.js + `d3-force-3d` physics) as the main
interactive centerpiece, plus a chat interface (LangChain/Anthropic) that
drives the graph. No commits exist yet in this repo — everything is
uncommitted/untracked (`git status` shows the whole `src/` tree as `??`).

### Just completed: left-framing camera swivel + centered detail card

The user asked for three things when a graph node is selected:
1. Remove the node's label/nametag while it's selected.
2. Show a detail card centered on screen (previously it was pinned
   bottom-left).
3. Make the selected node consistently land on the **left side** of the
   screen, "locked" in a way the app can always point to the same way —
   without moving the node itself (physics still places nodes freely) and
   without bringing back an earlier "camera jumps around" bug that had
   already been fixed once this session.

All three are implemented and verified working:

- **`src/lib/graph/selection.ts`** — `isLabeled()` now returns `false`
  whenever anything is selected (previously: only the selected node's own
  label showed; now: no labels show at all while selected). Deselected
  behavior unchanged.

- **`src/components/graph/GraphEngine3D.tsx`** — added a one-time camera
  effect (`framedSelectionRef` guard, keyed only on
  `selection.selectedNodeId`) that shifts the `lookAt` target sideways
  (never the camera position itself) so the selected node projects onto the
  left third of the screen, vertically centered. The sideways offset is
  **derived live from the camera's current FOV/aspect** each time
  (`k=0.5` targets NDC x=-0.5; `offsetFactor = k * tan(fov/2) * aspect`) —
  deliberately not a hardcoded constant, so it stays correct regardless of
  window size or how wide the chat dock currently is. Includes a fallback
  for the degenerate case where the node is ~directly above/below the
  camera (cross product near zero). Fires once per selection change, does
  nothing on deselect (camera stays wherever free-look left it — this
  matches the pre-existing "clicking a node doesn't move the camera"
  philosophy already documented in that file).

- **`src/components/graph/NodeDetailCard.tsx`** (new file) — replaces the
  deleted `DetailPanel.tsx`. Same props (`node`, `onClose`), same content
  layout (category tag, title, close ×, description, meta list, optional
  link), but positioned as a true viewport-centered card
  (`absolute inset-0 flex items-center justify-center`) instead of
  bottom-left-pinned.

- **`src/components/graph/GraphView.tsx`** — swapped `DetailPanel` import/
  usage for `NodeDetailCard`. Also: `navigateToNode` (the chat-driven
  selection path) now calls `select()` **immediately** rather than after a
  settle delay — this was a necessary fix, not just a swap (see race
  condition below).

- **`src/components/graph/DetailPanel.tsx`** — deleted.

### Race condition found and fixed mid-implementation

The new camera swivel fires synchronously on selection, but the existing
"re-fit the camera when visible node count grows" effect fires ~350ms later
via `setTimeout` (`GraphEngine3D.tsx`, the `lastFitNodeCount`-guarded
effect). Clicking "Me" both selects it and reveals its neighbors in one
tick, so both effects fired — the delayed `zoomToFit` was clobbering the
swivel a moment after it played, snapping the node back to dead-center.

Fixed by giving selection explicit priority: the re-fit effect now reads a
`selectedNodeIdRef` **inside its delayed callback** (checked at fire time,
not schedule time, since a selection can arrive during the 350ms window)
and skips the fit entirely if anything is selected.
`lastFitNodeCount.current` is only advanced when the fit actually runs, so a
later reveal-while-unselected still fits normally. The ref itself is
updated via a small dedicated `useEffect` (not assigned directly in the
render body — that trips the `react-hooks/refs` lint rule).

### Verified via Playwright (dev server + temp `npm install playwright`, cleaned up after each pass)

- Clicking "Me" reveals neighbors with the diamond swinging left, card
  centered.
- Clicking a non-center neighbor node lands it at ~24% across a 1440px
  canvas (target: left third) with the card centered, correct
  category/title/border-color, all other nodes faded, zero labels visible.
- Deselecting causes **zero** camera motion and correctly restores labels
  for previously-expanded nodes.
- `npx tsc --noEmit` and `npx eslint src/` both pass clean on every touched
  file.

### Known pre-existing bug — NOT caused by this session's work, NOT fixed

A nondeterministic crash: `Cannot read properties of undefined (reading
'tick')`, thrown inside `three-forcegraph`'s internal `layoutTick`
function (visible in the stack trace as
`node_modules/.../three-forcegraph.js` → `layoutTick` → `tickFrame` →
`_animationCycle`). Observed roughly 1 in every 3-5 automated node-click
interactions during Playwright verification this session. When it fires,
the graph canvas goes permanently blank (nothing renders — confirmed via
raw pixel sampling in an earlier investigation, not just visually blank)
and a dev-mode React error overlay ("1 Issue") appears; it does not
self-recover.

This was confirmed to **predate** the current session's changes — isolated
by temporarily disabling the new camera-swivel code entirely and
reproducing the identical crash and blank-canvas symptom unchanged. It's
logged here because it's the single biggest robustness risk in the graph UI
right now, but no root-causing has been done beyond confirming it's inside
the physics/rendering library's internals, not application code.

## What's changed since the plan was last touched (drift to be aware of)

While the plan/implementation above was being finished, `GraphView.tsx`
picked up **unrelated changes from elsewhere** (not part of this task) that
are now live in the file:

- The chat dock is now **resizable** by dragging its left edge:
  `dockWidth` state (default `DEFAULT_DOCK_WIDTH = 320`, clamped between
  `MIN_DOCK_WIDTH = 280` and `MAX_DOCK_WIDTH = 560`), `isResizingDock`
  state, and `handleResizeStart`/`handleResizeMove`/`handleResizeEnd`
  pointer-capture handlers wired to a `role="separator"` drag handle
  rendered only when `docked` is true.
- The old fixed `DOCK_WIDTH` constant is gone — everywhere that referenced
  it (the `pose` calculation, the graph-pane width style) now reads the
  `dockWidth` state variable instead.
- There's also an `InviteHeadline` component and `headlineDone` state in
  the invite flow that existed before this task started and were left
  untouched.

**This has NOT been re-verified against the new camera-framing/detail-card
work.** The left-framing math reads the camera's live `aspect` ratio each
time it fires, so in principle a resized dock should still work correctly
(the whole point of deriving the offset live rather than hardcoding it) —
but this has not actually been tested with a dragged/non-default dock
width. That's the immediate next thing to check.

## Immediate next step (explicitly deferred to "right after this")

The user has said, twice, that **fixed/deterministic node positions** are
the next task — moving away from the current fully free-floating
`d3-force-3d` physics layout toward some kind of locked position (or
locked angle) per node/category, so the graph's overall shape is
consistent across sessions instead of physics-placing things arbitrarily
each time. This was deliberately kept **out of scope** for the
left-framing/centered-card work just completed (confirmed with the user via
AskUserQuestion — they chose "out of scope for now" but flagged it as the
immediate next priority).

Relevant research already done (don't redo it):
- `d3-force-3d` fully supports `fx`/`fy`/`fz` fixed-position pinning
  (confirmed in `node_modules/d3-force-3d/src/simulation.js` — setting
  `node.fx/fy/fz` on a node datum permanently pins that axis, no force can
  move it; `three-forcegraph` and `react-force-graph-3d`'s TypeScript types
  already declare these fields).
- ~46 total nodes across 8 categories currently; skills alone are ~30 nodes
  (65%) — very uneven category sizes, so a naive "ring per category" layout
  won't be a clean fit; will need real design thought, not just picking an
  angle-per-category formula.
- Fixing positions will need to be reconciled with two existing systems
  that currently assume free-floating physics: the jitter-seed +
  physics-fling entrance effect (new nodes seed near "me"'s current
  position with small jitter, then physics flings them outward — this is
  the visual "growing out of the graph" effect), and the reveal-triggered
  `zoomToFit` (frames the graph's bounding box, currently assumes physics
  has settled into some spread).
- The already-shipped left-framing camera swivel and the deferred
  fixed-position work are complementary, not overlapping: the swivel solves
  *screen* placement (whichever node is selected reads as being on the
  left), fixed positions would solve *world* placement (nodes always sit in
  the same relative arrangement to each other). Neither alone fully solves
  "consistent, pointable-to" layout — this was explicitly discussed and the
  user chose to ship the screen-placement solve now and defer the
  world-placement one.

## Prompt to resume with

```
Continuing work on the PortfolioWebsite knowledge-graph. Read HANDOFF_1.md
(and any later-numbered HANDOFF_N.md files, which supersede/build on this
one — check for the highest number first) in the project root for full
context — it covers what was just shipped (a
left-framing camera swivel on node selection + a new centered
NodeDetailCard replacing the old bottom-left DetailPanel, plus a race-
condition fix between that swivel and the existing reveal-triggered
zoomToFit) and what's still open.

Two things to pick up:

1. GraphView.tsx picked up an unrelated resizable-chat-dock feature
   (dockWidth/isResizingDock state) while the camera-framing work was being
   finished. This hasn't been tested together with the new left-framing
   swivel or NodeDetailCard. Verify: drag the dock to a non-default width,
   then select a graph node, and confirm the node still lands correctly in
   the left third of the (now-narrower) graph pane and the centered card
   still looks right relative to that pane's width, not the full window.

2. The user's next priority (already agreed, not yet started): move node
   positions from fully free-floating d3-force physics toward some kind of
   fixed/deterministic layout, so the graph reads the same way session to
   session instead of physics scattering nodes arbitrarily. Don't restart
   research on this from scratch — HANDOFF_1.md summarizes what's already
   confirmed (d3-force-3d's fx/fy/fz API, current node/category counts, and
   the two existing systems — entrance jitter-fling and reveal zoomToFit —
   that will need to be reconciled with fixed positions). Start by asking
   the user what "locked positions and angles" should actually look like
   for ~46 nodes across 8 very unevenly-sized categories (skills alone are
   30 of them) — this needs real design input, not just an arbitrary ring
   formula.

Also worth flagging early (don't need to fix immediately, just don't forget
it exists): there's a nondeterministic pre-existing crash in
three-forcegraph's internal layoutTick that blanks the graph canvas
permanently when it fires (~1 in 3-5 node clicks during automated testing).
Confirmed unrelated to this session's changes. Full repro/symptom details
are in HANDOFF_1.md.
```
