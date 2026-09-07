import { motion } from "motion/react";

export default function Section({
  id,
  title,
  eyebrow,
  accentColor = "#5b8def",
  wide = false,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  accentColor?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    // The tint sits on this full-bleed wrapper, not the inner <section> —
    // the inner element is width-capped (max-w-3xl/5xl) for readable line
    // length, so its own background would leave the tint visibly boxed
    // in rather than washing the whole section the way a "mood per section"
    // ask calls for. Kept subtle (same 0d/low-alpha tint NodePhoto/
    // PhotoPlaceholder already use) so it reads as ambiance, not a color
    // block — and light enough that the divide-y borders between sections
    // in ResumeContent.tsx still read clearly at the seams.
    <div style={{ backgroundColor: `${accentColor}0d` }}>
      <section id={id} className={`mx-auto w-full px-6 py-20 sm:px-8 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-baseline gap-4"
        >
          <span className="h-px w-8 flex-none" style={{ backgroundColor: accentColor }} />
          <div>
            {eyebrow && (
              <p className="mb-1 font-mono text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: accentColor }}>
                {eyebrow}
              </p>
            )}
            <h2 className="text-3xl font-bold tracking-tight text-[#1f1e1b]">{title}</h2>
          </div>
        </motion.div>
        {children}
      </section>
    </div>
  );
}
