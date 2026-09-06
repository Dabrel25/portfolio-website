import Section from "./Section";
import { education } from "@/data/resume";

export default function Education() {
  return (
    <Section id="education" title="Education">
      <div className="space-y-8">
        {education.map((entry) => (
          <div key={entry.school}>
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
              <h3 className="text-lg font-semibold text-[#1f1e1b]">{entry.school}</h3>
              <span className="font-mono text-sm text-[#8a8878]">{entry.dates}</span>
            </div>
            <p className="mt-1 font-mono text-sm text-[#8a8878]">
              {entry.program} · {entry.location}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#4a493f]">{entry.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
