"use client";

import { useEffect, useState } from "react";
import type { Graph } from "@/data/graph";
import type { CameraDebugInfo } from "./GraphEngine3D";

/**
 * TEMPORARY dev tool for hand-picking fixed node positions and per-node
 * camera framing — not part of the shipped UI. Polls graph.nodes (mutated in
 * place by d3-force-3d physics) plus the live camera pose (fed in from
 * GraphEngine3D via onCameraDebugUpdate), and lets a hand-tuned framing be
 * CAPTURED per node: select a node, orbit/pan/zoom until the framing looks
 * right, hit "capture" — the node's x/y/z and the full camera pose
 * (position, lookAt, up, fov, distance) are stored together under that node
 * id. Captures persist in localStorage across reloads; "copy JSON" exports
 * the whole mapping (also logged to the console) ready to be pasted into a
 * fixed-layout data file. Delete this file (and its one usage in
 * GraphView.tsx) once the fixed-layout work lands.
 */
type NodePos = { id: string; label: string; category: string; x?: number; y?: number; z?: number };

export type CapturedPose = {
  node: { x: number; y: number; z: number };
  camera: CameraDebugInfo;
};

const POLL_MS = 250;
const STORAGE_KEY = "debug-captured-poses";

function round(n: number | undefined): string {
  return typeof n === "number" ? n.toFixed(1) : "—";
}

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

function r1Vec(v: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  return { x: r1(v.x), y: r1(v.y), z: r1(v.z) };
}

function loadCaptured(): Record<string, CapturedPose> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CapturedPose>) : {};
  } catch {
    return {};
  }
}

export default function DebugCoordsOverlay({
  graph,
  selectedNodeId,
  camera,
}: {
  graph: Graph;
  selectedNodeId: string | null;
  camera: CameraDebugInfo | null;
}) {
  const [positions, setPositions] = useState<NodePos[]>([]);
  const [showAll, setShowAll] = useState(false);
  // Lazy initializer with a window guard: localStorage only exists client-side,
  // and this overlay never server-renders (debugCoords is a client-read query
  // param), so there's no hydration-mismatch risk in loading eagerly here.
  const [captured, setCaptured] = useState<Record<string, CapturedPose>>(() =>
    typeof window === "undefined" ? {} : loadCaptured()
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const read = () => {
      setPositions(
        graph.nodes.map((n) => {
          const fg = n as NodePos;
          return { id: n.id, label: n.label, category: n.category, x: fg.x, y: fg.y, z: fg.z };
        })
      );
    };
    read();
    const interval = setInterval(read, POLL_MS);
    return () => clearInterval(interval);
  }, [graph.nodes]);

  const selected = positions.find((p) => p.id === selectedNodeId);
  const selectedCaptured = selected ? captured[selected.id] : undefined;
  const capturedCount = Object.keys(captured).length;

  const persist = (next: Record<string, CapturedPose>) => {
    setCaptured(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — captures still live in state for this session.
    }
  };

  const capturePose = () => {
    if (!selected || !camera || selected.x === undefined) return;
    persist({
      ...captured,
      [selected.id]: {
        node: { x: r1(selected.x), y: r1(selected.y!), z: r1(selected.z!) },
        camera: {
          position: r1Vec(camera.position),
          lookAt: r1Vec(camera.lookAt),
          up: r1Vec(camera.up),
          fov: r1(camera.fov),
          distance: r1(camera.distance),
        },
      },
    });
  };

  const removeCapture = (id: string) => {
    const next = { ...captured };
    delete next[id];
    persist(next);
  };

  const clearAll = () => {
    if (!window.confirm(`Clear all ${capturedCount} captured poses?`)) return;
    persist({});
  };

  const copyJson = async () => {
    const json = JSON.stringify(captured, null, 2);
    console.log("[DebugCoordsOverlay] captured poses:\n" + json);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — the console.log above still has the full JSON.
    }
  };

  return (
    <div className="pointer-events-auto absolute bottom-6 right-6 z-50 max-h-[70vh] w-80 overflow-auto rounded-xl border border-amber-400 bg-black/90 p-3 font-mono text-xs text-amber-200 shadow-2xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-bold text-amber-400">DEBUG: node coords</span>
        <button onClick={() => setShowAll((v) => !v)} className="rounded border border-amber-400 px-2 py-0.5 hover:bg-amber-400/20">
          {showAll ? "selected only" : "show all"}
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-amber-500">
          captured {capturedCount}/{positions.length}
        </span>
        <div className="flex gap-1">
          <button
            onClick={copyJson}
            disabled={capturedCount === 0}
            className="rounded border border-amber-400 px-2 py-0.5 hover:bg-amber-400/20 disabled:opacity-40"
          >
            {copied ? "copied ✓" : "copy JSON"}
          </button>
          <button
            onClick={clearAll}
            disabled={capturedCount === 0}
            className="rounded border border-amber-400 px-2 py-0.5 hover:bg-amber-400/20 disabled:opacity-40"
          >
            clear
          </button>
        </div>
      </div>

      {selected ? (
        <div className="mb-3 rounded bg-amber-400/10 p-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-amber-400">{selected.category} · {selected.label}</div>
              <div className="text-[11px] text-amber-500">{selected.id}</div>
            </div>
            <button
              onClick={capturePose}
              disabled={!camera || selected.x === undefined}
              className="rounded border border-amber-400 px-2 py-0.5 font-bold hover:bg-amber-400/20 disabled:opacity-40"
            >
              {selectedCaptured ? "re-capture" : "capture"}
            </button>
          </div>
          <div className="mt-1">x: {round(selected.x)}&nbsp;&nbsp;y: {round(selected.y)}&nbsp;&nbsp;z: {round(selected.z)}</div>
          {selectedCaptured && (
            <div className="mt-2 border-t border-amber-400/30 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-amber-400">
                <span>captured ✓</span>
                <button onClick={() => removeCapture(selected.id)} className="text-amber-500 underline hover:text-amber-300">
                  remove
                </button>
              </div>
              <div>
                cam&nbsp; {selectedCaptured.camera.position.x}, {selectedCaptured.camera.position.y}, {selectedCaptured.camera.position.z}
              </div>
              <div>
                look {selectedCaptured.camera.lookAt.x}, {selectedCaptured.camera.lookAt.y}, {selectedCaptured.camera.lookAt.z}
              </div>
              <div>dist {selectedCaptured.camera.distance}&nbsp;&nbsp;fov {selectedCaptured.camera.fov}°</div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3 text-amber-500">no node selected — click a node, frame it, then capture</div>
      )}

      <div className="mb-1 font-bold text-amber-400">camera (live)</div>
      {camera ? (
        <div className="mb-3 rounded bg-amber-400/10 p-2">
          <div>
            pos&nbsp; x: {round(camera.position.x)}&nbsp;&nbsp;y: {round(camera.position.y)}&nbsp;&nbsp;z: {round(camera.position.z)}
          </div>
          <div>
            look x: {round(camera.lookAt.x)}&nbsp;&nbsp;y: {round(camera.lookAt.y)}&nbsp;&nbsp;z: {round(camera.lookAt.z)}
          </div>
          <div>
            up&nbsp;&nbsp; x: {round(camera.up.x)}&nbsp;&nbsp;y: {round(camera.up.y)}&nbsp;&nbsp;z: {round(camera.up.z)}
          </div>
          <div>fov: {round(camera.fov)}°&nbsp;&nbsp;dist (zoom): {round(camera.distance)}</div>
        </div>
      ) : (
        <div className="mb-3 text-amber-500">no camera data</div>
      )}

      {showAll && (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="text-left text-amber-500">
              <th className="pr-2">id</th>
              <th className="pr-2">x</th>
              <th className="pr-2">y</th>
              <th className="pr-2">z</th>
              <th>cap</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.id} className={p.id === selectedNodeId ? "text-amber-300" : ""}>
                <td className="pr-2">{p.id}</td>
                <td className="pr-2">{round(p.x)}</td>
                <td className="pr-2">{round(p.y)}</td>
                <td className="pr-2">{round(p.z)}</td>
                <td>{captured[p.id] ? "✓" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
