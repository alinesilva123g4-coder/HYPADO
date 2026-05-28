export function InitialLoader() {
  return (
    <>
      <div
        id="hp-initial-loader"
        aria-hidden="true"
        suppressHydrationWarning
        className="fixed inset-0 z-[200] flex items-center justify-center bg-background overflow-hidden"
      >
        <LoaderArt />
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e){}
  try { window.scrollTo(0, 0); } catch(e){}
  var started = performance.now();
  var MIN = 900, MAX = 6000;
  function toTop(){ try { window.scrollTo(0, 0); } catch(e){} }
  toTop();
  function hide(){
    var el = document.getElementById('hp-initial-loader');
    if(!el || el.dataset.hiding) return;
    el.dataset.hiding = '1';
    var elapsed = performance.now() - started;
    var wait = Math.max(0, MIN - elapsed);
    setTimeout(function(){
      toTop();
      el.style.transition = 'opacity 600ms cubic-bezier(.22,1,.36,1)';
      el.style.opacity = '0';
      setTimeout(function(){
        el.style.pointerEvents = 'none';
        el.style.visibility = 'hidden';
        toTop();
      }, 650);
    }, wait);
  }
  if (document.readyState === 'complete') { hide(); }
  else { window.addEventListener('load', hide, { once: true }); }
  setTimeout(hide, MAX);
})();
        `.trim(),
        }}
      />
    </>
  );
}

function LoaderArt() {
  return (
    <>
      {/* Hatch texture base */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--foreground) 0 1px, transparent 1px 9px)",
        }}
      />
      {/* Soft vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 50%, color-mix(in srgb, var(--foreground) 8%, transparent) 100%)",
        }}
      />

      {/* Corner metadata */}
      <div
        className="absolute top-5 left-5 md:top-7 md:left-8 text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-foreground/45"
        style={{ animation: "hp-load-fade-up 700ms 200ms ease-out both" }}
      >
        HYPADO · 04°S 38°W
      </div>
      <div
        className="absolute top-5 right-5 md:top-7 md:right-8 text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-foreground/45 text-right"
        style={{ animation: "hp-load-fade-up 700ms 280ms ease-out both" }}
      >
        Drop 01 / NE
      </div>
      <div
        className="absolute bottom-5 left-5 md:bottom-7 md:left-8 text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-foreground/45"
        style={{ animation: "hp-load-fade-up 700ms 360ms ease-out both" }}
      >
        north east · brasil
      </div>
      <div
        className="absolute bottom-5 right-5 md:bottom-7 md:right-8 text-[9px] md:text-[10px] uppercase tracking-[0.45em] text-foreground/45 text-right tabular-nums"
        style={{ animation: "hp-load-fade-up 700ms 440ms ease-out both" }}
      >
        col · 01 / 25
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo with vertical mask reveal */}
        <div
          className="relative overflow-hidden"
          style={{ animation: "hp-load-fade-up 800ms ease-out both" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="HYPADO"
            className="h-24 md:h-32 w-auto object-contain select-none block"
            style={{ animation: "hp-logo-breathe 3.4s ease-in-out infinite" }}
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-background"
            style={{ animation: "hp-load-mask 1.1s cubic-bezier(.7,0,.3,1) both" }}
          />
        </div>

        {/* Rail — tick marks + sweep */}
        <div
          className="relative mt-9 md:mt-11 h-[10px] w-56 md:w-72 origin-center overflow-hidden"
          style={{ animation: "hp-rail-grow 700ms 220ms cubic-bezier(.22,.61,.36,1) both" }}
        >
          {/* tick marks */}
          <div className="absolute inset-0 flex items-center justify-between">
            {Array.from({ length: 13 }).map((_, i) => (
              <span
                key={i}
                className="h-full w-px bg-foreground"
                style={{
                  opacity: i === 0 || i === 12 ? 0.55 : 0.18,
                  animation: `hp-load-tick 2.4s ease-in-out ${i * 90}ms infinite`,
                }}
              />
            ))}
          </div>
          {/* base hairline */}
          <span className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-line" />
          {/* sweeping light */}
          <span
            className="absolute top-1/2 left-0 h-px w-1/3 -translate-y-1/2"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--foreground) 50%, transparent 100%)",
              animation: "hp-load-sweep 1.6s cubic-bezier(.45,.05,.55,.95) infinite",
            }}
          />
        </div>

        {/* Word rotator */}
        <div
          className="relative mt-6 md:mt-7 h-3 md:h-[14px] overflow-hidden text-[9px] md:text-[10px] uppercase tracking-[0.5em] text-foreground/70"
          style={{ animation: "hp-load-fade-up 700ms 500ms ease-out both" }}
        >
          <div
            className="flex flex-col leading-none"
            style={{ animation: "hp-load-words 4.5s cubic-bezier(.7,0,.3,1) infinite" }}
          >
            <span className="h-3 md:h-[14px] flex items-center">tecendo</span>
            <span className="h-3 md:h-[14px] flex items-center">preparando</span>
            <span className="h-3 md:h-[14px] flex items-center">carregando</span>
            <span className="h-3 md:h-[14px] flex items-center">tecendo</span>
          </div>
        </div>
      </div>
    </>
  );
}
