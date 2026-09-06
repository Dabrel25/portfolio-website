import { profile } from "@/data/resume";

export default function Hero() {
  return (
    <header className="mx-auto w-full max-w-3xl px-6 pt-24 pb-16 sm:px-8">
      <p className="mb-3 font-mono text-sm font-semibold uppercase tracking-widest text-[#8a8878]">
        {profile.title}
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-[#1f1e1b] sm:text-5xl">
        {profile.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#4a493f]">
        {profile.summary}
      </p>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-[#8a8878]">
        <span>{profile.location}</span>
        <a href={`mailto:${profile.email}`} className="hover:text-[#1f1e1b]">
          {profile.email}
        </a>
        <a href={`tel:${profile.phone.replace(/\s+/g, "")}`} className="hover:text-[#1f1e1b]">
          {profile.phone}
        </a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#1f1e1b]">
          GitHub
        </a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#1f1e1b]">
          LinkedIn
        </a>
      </div>
    </header>
  );
}
