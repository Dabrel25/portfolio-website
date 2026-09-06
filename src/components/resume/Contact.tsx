import { profile } from "@/data/resume";

export default function Contact() {
  return (
    <footer id="contact" className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8">
      <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-widest text-[#8a8878]">
        Contact
      </h2>
      <p className="text-sm leading-relaxed text-[#4a493f]">
        Reach out at{" "}
        <a href={`mailto:${profile.email}`} className="font-medium text-[#1f1e1b] hover:underline">
          {profile.email}
        </a>{" "}
        or{" "}
        <a href={`tel:${profile.phone.replace(/\s+/g, "")}`} className="font-medium text-[#1f1e1b] hover:underline">
          {profile.phone}
        </a>
        .
      </p>
      <p className="mt-6 font-mono text-xs text-[#a8a696]">
        © {new Date().getFullYear()} {profile.name}
      </p>
    </footer>
  );
}
