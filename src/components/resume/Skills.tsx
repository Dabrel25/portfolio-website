import Section from "./Section";
import { skills } from "@/data/resume";

export default function Skills() {
  return (
    <Section id="skills" title="Technical Skills">
      <div className="grid gap-6 sm:grid-cols-2">
        {skills.map((group) => (
          <div key={group.category}>
            <h3 className="font-mono text-sm font-semibold text-[#1f1e1b]">{group.category}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border px-3 py-1 font-mono text-xs text-[#4a493f]"
                  style={{ borderColor: "#5b8def40" }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
