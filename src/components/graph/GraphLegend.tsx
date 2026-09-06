import { categoryTheme, type NodeShape } from "@/lib/graph/theme";
import type { NodeCategory } from "@/data/graph";
import { CATEGORY_GROUPS } from "@/lib/graph/categories";

const SHAPE_CLIP_PATH: Partial<Record<NodeShape, string>> = {
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  triangle: "polygon(50% 0%, 100% 100%, 0% 100%)",
  hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
};

const legendGroups: { label: string; categories: NodeCategory[] }[] = [
  { label: "Me", categories: ["self"] },
  ...CATEGORY_GROUPS.map(({ label, categories }) => ({ label, categories })),
];

export default function GraphLegend() {
  return (
    <div className="w-56 rounded-2xl border border-[#e5e3d8] bg-white/80 px-4 py-3 font-mono text-xs text-[#6b6a62] backdrop-blur">
      <p className="mb-2 uppercase tracking-widest text-[#8a8878]">Legend</p>
      <ul className="space-y-1.5">
        {legendGroups.map(({ label, categories }) => {
          const theme = categoryTheme[categories[0]];
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className="h-4 w-4 flex-none"
                style={{
                  backgroundColor: theme.color,
                  borderRadius: theme.shape === "circle" ? "9999px" : theme.shape === "square" ? "2px" : undefined,
                  clipPath: SHAPE_CLIP_PATH[theme.shape],
                }}
              />
              <span>{label}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-[#e5e3d8] pt-2 leading-relaxed text-[#8a8878]">
        Hover over a line to see how things connect.
      </p>
    </div>
  );
}
