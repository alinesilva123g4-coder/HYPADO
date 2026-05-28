import Link from "next/link";

export function SimplePage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 md:px-6 pt-10 md:pt-16 pb-14 md:pb-24">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted">{eyebrow}</div>
      <h1 className="gothic mt-3 md:mt-4 text-5xl md:text-7xl text-foreground">{title}</h1>
      <div className="mt-6 md:mt-10 text-sm md:text-base leading-relaxed text-foreground/80 space-y-4">
        {children}
      </div>
      <div className="mt-10 md:mt-14">
        <Link
          href="/"
          className="text-[11px] md:text-xs uppercase tracking-widest text-muted hover:text-foreground underline underline-offset-4"
        >
          ← Voltar à home
        </Link>
      </div>
    </section>
  );
}
