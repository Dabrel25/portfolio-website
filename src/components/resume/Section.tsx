export default function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8">
      <h2 className="mb-8 font-mono text-sm font-semibold uppercase tracking-widest text-[#8a8878]">
        {title}
      </h2>
      {children}
    </section>
  );
}
