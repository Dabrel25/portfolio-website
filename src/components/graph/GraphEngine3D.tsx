"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import * as THREE from "three";
import { forceCollide, forceY, forceZ } from "d3-force-3d";
import { useReducedMotion } from "motion/react";
import type { ForceGraphProps, ForceGraphMethods } from "react-force-graph-3d";
import type { Graph, GraphNode, GraphEdge } from "@/data/graph";
import type { SelectionState } from "@/lib/graph/selection";
import { isEdgeFaded, isVisible } from "@/lib/graph/selection";
import { makeNodeThreeObject, type PulseTarget } from "./nodeRender3D";

const PULSE_PERIOD_MS = 1200;
const ENTRANCE_MS = 900;
const WIPE_ENTRANCE_MS = 1600;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

type FGNode = GraphNode & {
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  __threeObj?: THREE.Object3D;
};
type FGLink = GraphEdge & { source: string | FGNode; target: string | FGNode };
type FGMethods = ForceGraphMethods<GraphNode, GraphEdge>;
type FGProps = ForceGraphProps<GraphNode, GraphEdge> & { ref?: React.Ref<FGMethods> };

// next/dynamic erases the exported component's generic type params; recover
// them with a single cast here so every other usage below stays fully typed.
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
}) as unknown as ComponentType<FGProps>;

function endpointId(endpoint: string | FGNode): string {
  return typeof endpoint === "object" ? endpoint.id : endpoint;
}

/** Deterministic jitter in [-2, 2) derived from a node id, so repeated renders don't reshuffle positions (Math.random would be impure here — this runs inside useMemo). */
function jitterFor(id: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ((Math.abs(hash) % 1000) / 1000) * 4 - 2;
}

export type CameraDebugInfo = {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  up: { x: number; y: number; z: number };
  fov: number;
  distance: number;
};

// The framing "Overview" resets to — hand-picked via the debugCoords overlay
// (camera at (0,0,271) looking at the origin, fov 50°). Shared with the
// initial-load fit below so both land on the exact same pose.
const OVERVIEW_CAMERA_POSITION = { x: 0, y: 0, z: 271 };
const OVERVIEW_LOOKAT = { x: 0, y: 0, z: 0 };

export default function GraphEngine3D({
  graph,
  selection,
  onNodeClick,
  introRevealed = true,
  onCameraDebugUpdate,
  revealDelays,
  resetCameraSignal,
}: {
  graph: Graph;
  selection: SelectionState;
  onNodeClick: (nodeId: string) => void;
  introRevealed?: boolean;
  // TEMPORARY dev hook for hand-picking fixed node positions — polls the
  // live camera position/lookAt/FOV so a manually-orbited view can be read
  // back and frozen later. Remove alongside DebugCoordsOverlay once the
  // fixed-layout work lands.
  onCameraDebugUpdate?: (info: CameraDebugInfo) => void;
  // Optional per-node extra delay (ms) for the entrance stagger below,
  // keyed by node id — used by the invite headline's slow center-outward
  // "wipe" reveal to cascade nodes ring-by-ring instead of the default fast
  // per-node drip. Nodes not present in the map fall back to that default.
  revealDelays?: Map<string, number>;
  // Bumping this (e.g. a counter incremented on every click) flies the
  // camera back to the fixed OVERVIEW_CAMERA_POSITION/OVERVIEW_LOOKAT pose —
  // wired to the "↺ Overview" button in GraphView so resetting the selection
  // also resets the framing, not just which nodes are visible/highlighted.
  resetCameraSignal?: number;
}) {
  const fgRef = useRef<FGMethods | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [hoveredLink, setHoveredLink] = useState<FGLink | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const hasDoneInitialFit = useRef(false);
  const pulseTargetRef = useRef<PulseTarget | null>(null);
  const prefersReducedMotion = useReducedMotion();
  // Read inside the reveal re-fit's delayed callback (not captured at
  // schedule time) so a selection that arrives during the 350ms window still
  // suppresses the fit — a selected node's left-framing takes priority over
  // the generic "fit everything in view" reveal behavior.
  const selectedNodeIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedNodeIdRef.current = selection.selectedNodeId;
  }, [selection.selectedNodeId]);
  // Tracks when each node was first revealed, keyed by id — not stored on the
  // mesh/factory because nodeThreeObject's identity changes (and every mesh
  // is rebuilt) on every selection update, including each stagger tick of a
  // category reveal. Node ids persist across those rebuilds, so this is the
  // only stable place to remember "is this node new".
  const bornAtRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSelectedMesh = useCallback((target: PulseTarget) => {
    pulseTargetRef.current = target;
  }, []);

  // Pin every node's position once the simulation settles (fires whenever
  // cooldownTime elapses with no more motion — after the initial layout, and
  // again after each reveal's reheat). Setting fx/fy/fz freezes that node in
  // place for every future d3ReheatSimulation() (e.g. later reveals) without
  // needing to touch the physics config itself — pinned nodes still act as
  // static obstacles for charge/collision, only never move themselves again.
  // This is why "Overview" now shows already-explored nodes exactly where
  // they were instead of physics having quietly drifted them in the
  // background: without this, every reveal's reheat nudges the *entire*
  // graph, not just the newly-revealed nodes.
  const handleEngineStop = useCallback(() => {
    // graph.nodes objects are mutated in place by design (same as d3-force's
    // own x/y/z writes and the entrance-jitter seeding above) — they're the
    // live position store, not immutable render data. The lint rule can't
    // see that distinction from here.
    /* eslint-disable react-hooks/immutability */
    for (const node of graph.nodes as FGNode[]) {
      if (node.x === undefined || node.fx !== undefined) continue;
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
    }
    /* eslint-enable react-hooks/immutability */
  }, [graph.nodes]);

  const nodeThreeObject = useMemo(
    // handleSelectedMesh only writes pulseTargetRef when the returned factory
    // is later invoked by the library (post-render, per node) — never during
    // this render itself. The lint rule can't see that distinction from here.
    // eslint-disable-next-line react-hooks/refs
    () => makeNodeThreeObject(selection, graph.center, handleSelectedMesh),
    [selection, graph.center, handleSelectedMesh]
  );

  const visibleGraphData = useMemo(() => {
    const nodes = graph.nodes.filter((n) => isVisible(selection, n.id)) as FGNode[];
    const visibleIds = new Set(nodes.map((n) => n.id));
    const links = graph.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => ({ ...e }));

    // Nodes are the same object references across renders (graph.nodes is a
    // module-level constant), so d3-force's x/y/z lands directly on them and
    // persists once simulated. A node revealed for the first time has no
    // x/y/z yet — seed it near "me"'s current position (with jitter so
    // several new nodes don't stack exactly on top of each other) so physics
    // visibly flings it outward from center instead of popping in wherever
    // the layout engine's default placement happens to be.
    const centerNode = nodes.find((n) => n.id === graph.center);
    if (centerNode?.x !== undefined) {
      for (const node of nodes) {
        if (node.id === graph.center || node.x !== undefined) continue;
        node.x = centerNode.x + jitterFor(node.id, 1);
        node.y = (centerNode.y ?? 0) + jitterFor(node.id, 2);
        node.z = (centerNode.z ?? 0) + jitterFor(node.id, 3);
      }
    }

    return { nodes, links };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, selection.visibleNodeIds]);

  // Tune the physics so the graph settles into a compact, oblong cloud
  // instead of an even sprawl: moderate charge repulsion and short link
  // distances keep nodes close; weak pull-to-zero forces on the y and z axes
  // squash the cloud vertically and in depth (x stays free), so it reads as
  // a wide ellipse rather than a loose sphere. Collision force keeps label
  // chips from stacking on top of each other, and the damped decay settings
  // calm the chaotic fling the default physics has whenever new nodes are
  // revealed.
  useEffect(() => {
    if (!dimensions) return;
    const interval = setInterval(() => {
      if (!fgRef.current) return;
      const chargeForce = fgRef.current.d3Force("charge") as unknown as
        | { strength: (v: number) => void }
        | undefined;
      chargeForce?.strength(-120);
      const linkForce = fgRef.current.d3Force("link") as unknown as
        | { distance: (v: number) => void }
        | undefined;
      linkForce?.distance(32);
      fgRef.current.d3Force("collide", forceCollide(16));
      fgRef.current.d3Force("squashY", forceY(0).strength(0.1));
      fgRef.current.d3Force("squashZ", forceZ(0).strength(0.16));
      fgRef.current.d3ReheatSimulation();
      clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [dimensions]);

  // Known harmless crash: dragging a node fires react-force-graph-3d's own
  // DragControls, which competes with OrbitControls (remapped below to pan
  // on left-drag) for the same pointer-up event. DragControls clears its
  // internal pointer state first, then OrbitControls.onPointerUp reaches
  // for that already-cleared state and throws "Cannot read properties of
  // undefined (reading 'x')". Doesn't affect drag/pan behavior — verified
  // interactively — just surfaces as a scary-looking overlay in dev. Swallow
  // only this exact signature so any other runtime error still surfaces.
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      const stack = e.error?.stack ?? "";
      if (e.message.includes("reading 'x'") && stack.includes("OrbitControls")) {
        e.preventDefault();
      }
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Clamp zoom so visitors can't push the camera inside a node mesh (too
  // close) or scroll out until the graph shrinks to an indistinct dot (too
  // far). Bounds are picked around the distances already used elsewhere: the
  // click-to-node fly-to sits at 90, the intro lock at 75. 900 gives the
  // full-graph wipe reveal's zoomToFit room to fit every node without
  // clamping; fog (above) scales with live camera distance so any distance up
  // to this ceiling still reads as a legible, if hazier, overview rather than
  // fully fogged out.
  useEffect(() => {
    if (!dimensions) return;
    const interval = setInterval(() => {
      const controls = fgRef.current?.controls() as
        | { minDistance?: number; maxDistance?: number; mouseButtons?: { LEFT: THREE.MOUSE | null } }
        | undefined;
      if (!controls || controls.minDistance === undefined) return;
      controls.minDistance = 25;
      controls.maxDistance = 900;
      // Plain drag moves through space (pan); OrbitControls' built-in
      // modifier flip then makes shift/ctrl/cmd + drag rotate — the reverse
      // of its default mapping, so travel is the primary gesture.
      if (controls.mouseButtons) controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [dimensions]);

  // TEMPORARY: poll the live camera position/lookAt/FOV four times a second so a
  // manually-orbited/zoomed view (not just node world position) can be read
  // back while hand-picking fixed camera framing per node. controls().target
  // is a live THREE.Vector3 that free-orbiting (drag/pan/zoom) updates in
  // place, same as node x/y/z being mutated in place by physics — reading it
  // here doesn't require touching the swivel/orbit logic at all. distance is
  // reported as camera-to-target distance (this is a perspective camera, so
  // there's no literal "zoom" factor — distance is the meaningful analog).
  useEffect(() => {
    if (!onCameraDebugUpdate) return;
    const interval = setInterval(() => {
      if (!fgRef.current) return;
      const camera = fgRef.current.camera() as THREE.PerspectiveCamera;
      const controls = fgRef.current.controls() as { target?: THREE.Vector3 } | undefined;
      const target = controls?.target;
      if (!target) return;
      onCameraDebugUpdate({
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        lookAt: { x: target.x, y: target.y, z: target.z },
        up: { x: camera.up.x, y: camera.up.y, z: camera.up.z },
        fov: camera.fov,
        distance: camera.position.distanceTo(target),
      });
    }, 250);
    return () => clearInterval(interval);
  }, [onCameraDebugUpdate]);

  // Fade distant nodes toward the background color so the scene reads as
  // having real depth instead of flat cutouts. A fixed near/far range can't
  // work across the huge range of viewing distances this scene now spans
  // (~90 focused on a single node vs ~800 fit to the full graph after the
  // wipe reveal) — at any fixed far, a distance 4x further out than where it
  // was tuned reads as almost fully fogged. So near/far scale with the live
  // camera-to-target distance instead, keeping the same relative depth cue at
  // every zoom level. Ratios (0.6 / 2.75) are derived from the values this
  // was originally tuned at by hand (120/200, 550/200). The Math.max floors
  // reproduce that original tuning exactly at typical distances: at the
  // click-to-node fly-to distance (90), near stays 120 > 90 so a focused node
  // never fogs; at the pre-wipe overview distance (~200), near/far equal
  // 120/550 exactly as before.
  useEffect(() => {
    if (!dimensions) return;
    let frameId: number;
    const tick = () => {
      const fg = fgRef.current;
      const scene = fg?.scene?.();
      const controls = fg?.controls() as { target?: THREE.Vector3 } | undefined;
      const target = controls?.target;
      if (scene && target) {
        const distance = fg!.camera().position.distanceTo(target);
        if (!scene.fog) scene.fog = new THREE.Fog(0xfaf8f5, 120, 550);
        const fog = scene.fog as THREE.Fog;
        fog.near = Math.max(120, 0.6 * distance);
        fog.far = Math.max(550, 2.75 * distance);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [dimensions]);

  // Fit the camera to the initial overview on first load. fgRef.current is
  // still null on mount (dynamic import hasn't resolved) so this polls the
  // same way the other setup effects above do; the ref guard means it only
  // ever fires once, leaving later fits to the click-to-node effect below.
  // With only "Me" visible (knowledge-graph section's starting state),
  // zoomToFit has nothing to measure a spread from and can rack the camera
  // in far too close — park it at a fixed, comfortable distance instead.
  useEffect(() => {
    if (!introRevealed || hasDoneInitialFit.current || !dimensions) return;
    const interval = setInterval(() => {
      if (!fgRef.current || hasDoneInitialFit.current) return;
      hasDoneInitialFit.current = true;
      if (visibleGraphData.nodes.length <= 1) {
        fgRef.current.cameraPosition({ x: 0, y: 0, z: 180 }, { x: 0, y: 0, z: 0 }, 0);
      } else {
        fgRef.current.zoomToFit(1000, 10);
      }
      clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [introRevealed, dimensions, visibleGraphData.nodes.length]);

  // Re-fit the camera once whenever the visible node count grows (a reveal),
  // and never on select/deselect — clicking a node highlights and pulses it
  // in place instead of moving the camera. This is the only camera motion
  // after the initial load, so the view stays calm instead of chasing each
  // click/reveal around the scene. The generous padding (60, vs. 10 used for
  // the very first fit) keeps the whole cluster comfortably inside the frame
  // with room to spare, reading as "centered" rather than tightly cropped.
  //
  // A selection takes priority over this fit: if a node is selected by the
  // time the fit's delayed callback runs, skip it entirely — otherwise the
  // fit's zoomToFit would clobber the left-framing swivel below a moment
  // after it plays (e.g. clicking "Me" both selects it and reveals its
  // neighbors in the same tick). lastFitNodeCount only advances when the fit
  // actually runs, so a later reveal-while-unselected still triggers a fit.
  const lastFitNodeCount = useRef(1);
  useEffect(() => {
    if (!introRevealed || !fgRef.current || !hasDoneInitialFit.current) return;
    const nodeCount = visibleGraphData.nodes.length;
    if (nodeCount <= lastFitNodeCount.current) return;
    // node positions settle asynchronously after graphData updates and the
    // entrance animation needs time to spread new nodes out; wait for both.
    // A wipe reveal (revealDelays populated) stretches that wait to cover
    // its slowest ring's entrance — otherwise this fit fires mid-wipe, framing
    // only the handful of nodes that have appeared so far near the center,
    // and the later rings then expand past that stale framing.
    let maxWipeDelay = 0;
    if (revealDelays) {
      for (const delay of revealDelays.values()) maxWipeDelay = Math.max(maxWipeDelay, delay);
    }
    const fitDelay = maxWipeDelay > 0 ? maxWipeDelay + WIPE_ENTRANCE_MS : 350;
    const timeout = setTimeout(() => {
      if (!fgRef.current || nodeCount <= 1) return;
      if (selectedNodeIdRef.current) return;
      lastFitNodeCount.current = nodeCount;
      fgRef.current.zoomToFit(1200, 60);
    }, fitDelay);
    return () => clearTimeout(timeout);
  }, [introRevealed, visibleGraphData.nodes.length, revealDelays]);

  // Swivel the camera so the selected node lands in the left third of the
  // frame — never re-centered, never re-triggered by physics/reveals. Only
  // the lookAt target moves (camera position itself is untouched), which
  // keeps this bounded to a swivel rather than a jump: no zoom change, no
  // translation across the scene. Deselecting does nothing camera-wise
  // (matches the "clicking a node doesn't move the camera" philosophy above)
  // — the visitor keeps whatever view they're left with.
  //
  // aspectOverride lets the resize-driven re-aim below pass the container's
  // just-measured width/height directly — react-force-graph-3d updates
  // camera.aspect from the width/height props asynchronously, so reading
  // camera.aspect in the same tick dimensions changes can be one frame stale.
  const aimAtSelected = useCallback(
    (nodeId: string, durationMs: number, aspectOverride?: number) => {
      if (!fgRef.current) return;
      // Look up on graph.nodes (stable object references, mutated in place by
      // physics) rather than visibleGraphData.nodes, so callers keyed only on
      // selectedNodeId don't risk re-triggering on physics-driven changes
      // instead of only on an actual selection change.
      const node = graph.nodes.find((n) => n.id === nodeId) as FGNode | undefined;
      if (node?.x === undefined || node?.y === undefined || node?.z === undefined) return;

      const camera = fgRef.current.camera();
      const camPos = camera.position;
      const nodePos = new THREE.Vector3(node.x, node.y, node.z);
      const dir = nodePos.clone().sub(camPos);
      const dist = dir.length();
      if (dist === 0) return;
      dir.normalize();

      let right = new THREE.Vector3().crossVectors(dir, camera.up);
      if (right.lengthSq() < 1e-6) {
        // dir is ~parallel to camera.up (node is almost directly above/below
        // the camera) — cross product degenerates. Any vector perpendicular
        // to dir works as a fallback; try world +X, or +Z if dir is itself
        // nearly parallel to +X.
        const fallbackAxis = Math.abs(dir.x) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
        right = new THREE.Vector3().crossVectors(dir, fallbackAxis);
      }
      right.normalize();

      // Derive the sideways offset from the camera's own FOV/aspect rather
      // than a fixed constant, so the node lands at the same screen-relative
      // position (left third, vertically centered) regardless of window
      // size or whether the chat panel is currently docked/resized (which
      // changes the canvas aspect ratio). k=0.5 targets NDC x = -0.5.
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const aspect = aspectOverride ?? perspectiveCamera.aspect;
      const k = 0.5;
      const halfFovRad = THREE.MathUtils.degToRad(perspectiveCamera.fov) / 2;
      const offsetFactor = k * Math.tan(halfFovRad) * aspect;

      const lookAt = nodePos.clone().add(right.multiplyScalar(dist * offsetFactor));
      fgRef.current.cameraPosition({ x: camPos.x, y: camPos.y, z: camPos.z }, { x: lookAt.x, y: lookAt.y, z: lookAt.z }, durationMs);
    },
    [graph.nodes]
  );

  const framedSelectionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selection.selectedNodeId) {
      framedSelectionRef.current = null;
      return;
    }
    if (framedSelectionRef.current === selection.selectedNodeId) return;
    framedSelectionRef.current = selection.selectedNodeId;
    aimAtSelected(selection.selectedNodeId, 700);
  }, [selection.selectedNodeId, aimAtSelected]);

  // Re-aim (no animation, instant snap) whenever the canvas's own dimensions
  // change while a node is already framed — dragging the chat dock's resize
  // handle, the dock's own open/close width transition, or a plain window
  // resize would otherwise leave the selected node drifting away from the
  // left-third target, since the swivel above only fires once per selection
  // and bakes in whatever aspect ratio was current at that moment. Only acts
  // once the initial swivel has actually run (framedSelectionRef set) so this
  // doesn't race the animated 700ms swivel on a brand-new selection.
  useEffect(() => {
    if (!dimensions || !selection.selectedNodeId) return;
    if (framedSelectionRef.current !== selection.selectedNodeId) return;
    aimAtSelected(selection.selectedNodeId, 0, dimensions.width / dimensions.height);
  }, [dimensions, selection.selectedNodeId, aimAtSelected]);

  // Fly back to the fixed overview framing whenever resetCameraSignal changes
  // (the "↺ Overview" button bumps a counter). Guarded on it actually
  // changing from a previous value (not just truthy) so this doesn't also
  // fire once on mount if a parent ever initializes the counter above 0.
  const lastResetSignalRef = useRef(resetCameraSignal);
  useEffect(() => {
    if (resetCameraSignal === undefined || resetCameraSignal === lastResetSignalRef.current) return;
    lastResetSignalRef.current = resetCameraSignal;
    if (!fgRef.current) return;
    fgRef.current.cameraPosition(OVERVIEW_CAMERA_POSITION, OVERVIEW_LOOKAT, 700);
  }, [resetCameraSignal]);

  // Pulse the selected node's glow/scale via a dedicated rAF loop rather than
  // onEngineTick — the latter stops firing once the physics simulation cools
  // down (cooldownTime={2000} above), which would freeze the pulse a couple
  // seconds after a visitor stops interacting, exactly while they're reading
  // the detail panel. This loop runs independently for as long as a node is
  // selected, regardless of physics state.
  useEffect(() => {
    if (!selection.selectedNodeId) return;
    let frameId: number;
    const tick = () => {
      const target = pulseTargetRef.current;
      if (target) {
        const phase = (performance.now() % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
        const wave = Math.sin(phase * Math.PI * 2);
        target.mesh.scale.setScalar(target.baseScale + wave * 0.08);
        target.material.emissiveIntensity = 0.25 + wave * 0.25;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      pulseTargetRef.current = null;
    };
  }, [selection.selectedNodeId]);

  // Record the moment each node first becomes visible, staggering ids that
  // arrive in the same batch (a category reveal) by a small offset each so
  // they cascade in one after another rather than all growing in unison —
  // without needing multiple state updates/physics reheats to do it. Runs
  // off visibleNodeIds (not the render itself) so performance.now() never
  // executes inside a memo/render body — this effect is the impurity
  // boundary. A node present in revealDelays (the wipe reveal) uses its
  // explicit ring-based delay instead of the default fast per-node offset.
  const wipeNodeIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const now = performance.now();
    let i = 0;
    for (const id of selection.visibleNodeIds) {
      if (!bornAtRef.current.has(id)) {
        const wipeDelay = revealDelays?.get(id);
        if (wipeDelay !== undefined) {
          bornAtRef.current.set(id, now + wipeDelay);
          wipeNodeIdsRef.current.add(id);
        } else {
          bornAtRef.current.set(id, now + i * 90);
          i += 1;
        }
      }
    }
  }, [selection.visibleNodeIds, revealDelays]);

  // Scale newly-revealed nodes in from nothing instead of letting them pop in
  // at full size. nodeThreeObject rebuilds every mesh on each selection
  // update (including every stagger tick of a category reveal), so this
  // can't be baked into the factory — instead we reach into each node's live
  // __threeObj (react-force-graph-3d hangs the current group there) every
  // frame and set its scale directly; if a mid-animation rebuild swaps the
  // group out, the very next frame just re-applies scale to the new one, so
  // the tween self-heals across rebuilds instead of restarting or glitching.
  useEffect(() => {
    if (prefersReducedMotion) return;
    let frameId: number;
    const tick = () => {
      const now = performance.now();
      let stillAnimating = false;
      for (const node of visibleGraphData.nodes) {
        const bornAt = bornAtRef.current.get(node.id);
        if (bornAt === undefined) continue;
        const duration = wipeNodeIdsRef.current.has(node.id) ? WIPE_ENTRANCE_MS : ENTRANCE_MS;
        const elapsed = now - bornAt;
        if (elapsed >= duration) continue;
        stillAnimating = true;
        const obj = node.__threeObj;
        if (!obj) continue;
        // elapsed can be negative for ids further down this batch's stagger
        // offset (born-at timestamp is still in the future) — hold at scale
        // 0 rather than feeding easeOutCubic a negative t, which inverts it.
        obj.scale.setScalar(elapsed < 0 ? 0 : easeOutCubic(elapsed / duration));
      }
      if (stillAnimating) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [visibleGraphData.nodes, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #faf8f5 0%, #f0ebe1 100%)",
      }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(31,30,27,0.08) 100%)",
        }}
      />

      {dimensions && (
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={visibleGraphData}
          nodeId="id"
          // Orbit (not the default trackball) so visitors can actually move
          // through the space, not just circle one pivot. The controls-setup
          // effect above remaps the left button to PAN: plain drag travels,
          // shift/ctrl/cmd + drag rotates. Orbit also keeps the up-axis
          // locked, which the aimAtSelected right-vector math benefits from.
          controlType="orbit"
          nodeThreeObject={nodeThreeObject}
          linkColor={(link: FGLink) =>
            isEdgeFaded(selection, endpointId(link.source), endpointId(link.target))
              ? "rgba(31,30,27,0.04)"
              : "rgba(31,30,27,0.55)"
          }
          linkCurvature={0.2}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkHoverPrecision={4}
          onLinkHover={(link: FGLink | null) => setHoveredLink(link)}
          backgroundColor="rgba(0,0,0,0)"
          onNodeClick={(node: FGNode) => onNodeClick(node.id)}
          onBackgroundClick={() => onNodeClick("")}
          onEngineStop={handleEngineStop}
          enableNavigationControls={introRevealed}
          cooldownTime={2000}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.35}
        />
      )}

      {hoveredLink && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-full border border-[#e5e3d8] bg-white/95 px-3 py-1 font-mono text-xs text-[#4a493f] shadow-md backdrop-blur"
          style={{ left: cursor.x, top: cursor.y - 10 }}
        >
          {hoveredLink.label}
        </div>
      )}
    </div>
  );
}
