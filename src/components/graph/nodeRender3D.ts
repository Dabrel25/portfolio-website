import * as THREE from "three";
import type { GraphNode } from "@/data/graph";
import { themeFor, type NodeShape } from "@/lib/graph/theme";
import type { SelectionState } from "@/lib/graph/selection";
import { isFaded, isLabeled } from "@/lib/graph/selection";

const NODE_SIZE = 5;
const CENTER_NODE_SIZE = 20;
const MAX_LABEL_CHARS = 28;
const MAX_LABEL_WORLD_WIDTH = 45;

const geometryCache = new Map<string, THREE.BufferGeometry>();

function geometryFor(shape: NodeShape, size: number): THREE.BufferGeometry {
  const key = `${shape}|${size}`;
  let cached = geometryCache.get(key);
  if (cached) return cached;

  switch (shape) {
    case "square":
      cached = new THREE.BoxGeometry(size, size, size);
      break;
    case "diamond":
      cached = new THREE.OctahedronGeometry(size * 0.8);
      break;
    case "triangle":
      cached = new THREE.ConeGeometry(size, size * 1.4, 3);
      break;
    case "hexagon":
      cached = new THREE.CylinderGeometry(size * 0.8, size * 0.8, size * 0.6, 6);
      break;
    case "circle":
    default:
      cached = new THREE.SphereGeometry(size * 0.8, 16, 16);
      break;
  }
  geometryCache.set(key, cached);
  return cached;
}

const labelSpriteCache = new Map<string, THREE.Sprite>();

function buildLabelSprite(text: string, color: string, fontSize: number): THREE.Sprite {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontSize}px "Geist Mono", monospace`;
  const width = ctx.measureText(text).width + 24;
  const height = fontSize + 16;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.font = `${fontSize}px "Geist Mono", monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  ctx.fillStyle = "#1f1e1b";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);

  const scaleX = width / 6;
  const scaleY = height / 6;
  const shrink = Math.min(1, MAX_LABEL_WORLD_WIDTH / scaleX);
  sprite.scale.set(scaleX * shrink, scaleY * shrink, 1);
  return sprite;
}

function truncateLabel(text: string): string {
  return text.length > MAX_LABEL_CHARS ? `${text.slice(0, MAX_LABEL_CHARS - 1)}…` : text;
}

function makeLabelSprite(text: string, color: string, fontSize = 28): THREE.Sprite {
  const truncated = truncateLabel(text);
  const key = `${truncated}|${color}|${fontSize}`;
  let cached = labelSpriteCache.get(key);
  if (!cached) {
    cached = buildLabelSprite(truncated, color, fontSize);
    labelSpriteCache.set(key, cached);
  }
  return cached.clone();
}

const materialCache = new Map<string, THREE.MeshLambertMaterial>();

function materialFor(color: string, faded: boolean): THREE.MeshLambertMaterial {
  const opacity = faded ? 0.15 : 1;
  const key = `${color}|${opacity}`;
  let cached = materialCache.get(key);
  if (!cached) {
    cached = new THREE.MeshLambertMaterial({ color, transparent: true, opacity });
    materialCache.set(key, cached);
  }
  return cached;
}

export type PulseTarget = { mesh: THREE.Mesh; material: THREE.MeshLambertMaterial; baseScale: number };

export function makeNodeThreeObject(
  selection: SelectionState,
  centerId: string,
  onSelectedMesh?: (target: PulseTarget) => void
) {
  return (nodeObj: object) => {
    const node = nodeObj as GraphNode;
    const theme = themeFor(node.category);
    const faded = isFaded(selection, node.id);
    const isSelected = selection.selectedNodeId === node.id;
    const isCenter = node.id === centerId;
    const size = isCenter ? CENTER_NODE_SIZE : NODE_SIZE;

    const group = new THREE.Group();

    const geometry = geometryFor(theme.shape, size);
    // The selected node gets its own material instance (never the shared
    // cache) since its emissiveIntensity is mutated every frame for the
    // pulse — reusing a cached material would make every same-colored node
    // pulse together, and leave it glowing after deselect.
    const material = isSelected
      ? new THREE.MeshLambertMaterial({
          color: theme.color,
          emissive: theme.color,
          emissiveIntensity: 0,
          transparent: true,
          opacity: 1,
        })
      : materialFor(theme.color, faded);
    const mesh = new THREE.Mesh(geometry, material);
    if (isSelected) {
      mesh.scale.setScalar(1.4);
      onSelectedMesh?.({ mesh, material, baseScale: 1.4 });
    }
    group.add(mesh);

    if (!faded && isLabeled(selection, node.id)) {
      const label = makeLabelSprite(node.label, theme.color, isCenter ? 48 : 28);
      label.position.set(0, size + (isCenter ? 10 : 6), 0);
      group.add(label);
    }

    return group;
  };
}
