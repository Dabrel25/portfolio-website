import Section from "./Section";
import { projects } from "@/data/resume";

export default function Projects() {
  return (
    <Section id="projects" title="Projects">
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.name}
            className="rounded-lg border p-6"
            style={{ borderColor: "#5b8def40" }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold text-[#1f1e1b]">
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {project.name}
                  </a>
                ) : (
                  project.name
                )}
              </h3>
            </div>
            <p className="mt-1 text-sm text-[#4a493f]">{project.description}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[#8a8878]">
              {project.stack}
            </p>
            <ul className="mt-4 space-y-2">
              {project.highlights.map((point, i) => (
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
