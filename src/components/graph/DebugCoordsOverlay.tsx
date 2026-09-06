"use client";

import { useEffect, useState } from "react";
import type { Graph } from "@/data/graph";
import type { CameraDebugInfo } from "./GraphEngine3D";

/**
 * TEMPORARY dev tool for hand-picking fixed node positions — not part of the
 * shipped UI. Polls graph.nodes (mutated in place by d3-force-3d physics)
 * every second and shows the selected node's live x/y/z plus a full table of
 * every node, so coordinates can be read off while dragging/orbiting and
 * fed back as a fixed layout. Also shows the live camera position/lookAt/
 * FOV/distance (fed in from GraphEngine3D via onCameraDebugUpdate) so the
 * camera's framing — not just the node's world position — can be read back
 * and frozen too. Delete this file (and its one usage in GraphView.tsx) once
 * the fixed-layout work lands.
 */
type NodePos = { id: string; label: string; category: string; x?: number; y?: number; z?: number };

const POLL_MS = 1000;

function round(n: number | undefined): string {
  return typeof n === "number" ? n.toFixed(1) : "—";
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

  return (
    <div className="pointer-events-auto absolute bottom-6 right-6 z-50 max-h-[70vh] w-80 overflow-auto rounded-xl border border-amber-400 bg-black/90 p-3 font-mono text-xs text-amber-200 shadow-2xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-bold text-amber-400">DEBUG: node coords</span>
        <button onClick={() => setShowAll((v) => !v)} className="rounded border border-amber-400 px-2 py-0.5 hover:bg-amber-400/20">
          {showAll ? "selected only" : "show all"}
        </button>
      </div>

      {selected ? (
        <div className="mb-3 rounded bg-amber-400/10 p-2">
          <div className="text-amber-400">{selected.category} · {selected.label}</div>
          <div className="text-[11px] text-amber-500">{selected.id}</div>
          <div className="mt-1">x: {round(selected.x)}&nbsp;&nbsp;y: {round(selected.y)}&nbsp;&nbsp;z: {round(selected.z)}</div>
        </div>
      ) : (
        <div className="mb-3 text-amber-500">no node selected</div>
      )}

      <div className="mb-1 font-bold text-amber-400">camera</div>
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
              <th>z</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.id} className={p.id === selectedNodeId ? "text-amber-300" : ""}>
                <td className="pr-2">{p.id}</td>
                <td className="pr-2">{round(p.x)}</td>
                <td className="pr-2">{round(p.y)}</td>
                <td>{round(p.z)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
