"use client";

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-background overflow-hidden"
      aria-busy="true"
      aria-live="polite"
      style={{ animation: "hp-veil-in 400ms ease-out both" }}
    >
      {/* vignette sutil */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 55%, color-mix(in srgb, var(--foreground) 6%, transparent) 100%)",
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo.png"
          alt="HYPADO"
          className="h-20 md:h-28 w-auto object-contain select-none"
          style={{ animation: "hp-logo-breathe 3.2s ease-in-out infinite" }}
        />

        {/* hairline divider com ponto sweeping */}
        <div
          className="relative mt-7 md:mt-9 h-px w-44 md:w-56 bg-line origin-center"
          style={{ animation: "hp-rail-grow 700ms 200ms cubic-bezier(.22,.61,.36,1) both" }}
        >
          <span
            className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
            style={{ animation: "hp-rail-dot 2.8s cubic-bezier(.45,.05,.55,.95) infinite" }}
          />
        </div>

        {/* caption */}
        <div
          className="mt-5 md:mt-6 text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-muted"
          style={{ animation: "hp-caption-rise 700ms 500ms ease-out both" }}
        >
          carregando
        </div>
      </div>
    </div>
  );
}
