import Section from "./Section";
import { awards } from "@/data/resume";

export default function Awards() {
  return (
    <Section id="awards" title="Awards">
      <ul className="space-y-4">
        {awards.map((award) => (
          <li key={award.title}>
            <p className="text-sm font-semibold text-[#1f1e1b]">{award.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#4a493f]">{award.detail}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
