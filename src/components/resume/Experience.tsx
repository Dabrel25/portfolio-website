import Section from "./Section";
import { experience } from "@/data/resume";

export default function Experience() {
  return (
    <Section id="experience" title="Experience">
      <div className="space-y-12">
        {experience.map((job) => (
          <div key={job.company}>
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
              <h3 className="text-lg font-semibold text-[#1f1e1b]">
                {job.role} · {job.company}
              </h3>
              <span className="font-mono text-sm text-[#8a8878]">{job.dates}</span>
            </div>
            <p className="mt-1 font-mono text-sm text-[#8a8878]">{job.location}</p>
            <ul className="mt-4 space-y-2">
              {job.highlights.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#4a493f]">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-[#5b8def]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
