import Link from "next/link";

const links = [
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#education", label: "Education" },
  { href: "#skills", label: "Skills" },
  { href: "#awards", label: "Awards" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  return (
    <nav className="sticky top-0 z-10 border-b border-[#e5e3d8] bg-[#f5f4ed]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-6 overflow-x-auto px-6 py-4 sm:px-8">
        <div className="flex gap-6 font-mono text-sm text-[#8a8878]">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="whitespace-nowrap hover:text-[#1f1e1b]">
              {link.label}
            </a>
          ))}
        </div>
        <Link
          href="/?graph=1"
          className="order-first whitespace-nowrap rounded-full border border-[#e5e3d8] px-4 py-1.5 font-mono text-xs uppercase text-[#8a8878] hover:text-[#1f1e1b]"
        >
          ← Graph
        </Link>
      </div>
    </nav>
  );
}
