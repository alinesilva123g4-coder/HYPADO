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
  var MIN = 700, MAX = 2200;
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
      // libera cliques IMEDIATAMENTE, mesmo durante o fade
      el.style.pointerEvents = 'none';
      el.style.transition = 'opacity 450ms cubic-bezier(.22,1,.36,1)';
      el.style.opacity = '0';
      setTimeout(function(){
        el.style.visibility = 'hidden';
        toTop();
      }, 500);
    }, wait);
  }
  if (document.readyState === 'complete') { hide(); }
  else {
    window.addEventListener('load', hide, { once: true });
    // backup: se DOMContentLoaded disparar e tudo já estiver renderizado, libera
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(hide, 400); }, { once: true });
  }
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
      {/* Paper grain base */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--foreground) 0 1px, transparent 1px 7px)",
        }}
      />
      {/* Soft vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 55%, color-mix(in srgb, var(--foreground) 8%, transparent) 100%)",
        }}
      />

      {/* Central composition */}
      <div className="relative flex flex-col items-center">
        {/* Logo with vertical mask reveal + breathing */}
        <div
          className="relative overflow-hidden"
          style={{ animation: "hp-load-fade-up 800ms ease-out both" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt=""
            className="h-28 md:h-40 w-auto object-contain select-none block"
            style={{ animation: "hp-logo-breathe 3.4s ease-in-out infinite" }}
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-background"
            style={{ animation: "hp-load-mask 1.1s cubic-bezier(.7,0,.3,1) both" }}
          />
        </div>

        {/* Three soft dots */}
        <div
          className="mt-10 md:mt-12 flex items-center gap-2"
          style={{ animation: "hp-load-fade-up 700ms 400ms ease-out both" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-foreground/80"
            style={{ animation: "hp-dot-bounce 1.4s ease-in-out infinite" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-foreground/80"
            style={{ animation: "hp-dot-bounce 1.4s 0.18s ease-in-out infinite" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-foreground/80"
            style={{ animation: "hp-dot-bounce 1.4s 0.36s ease-in-out infinite" }}
          />
        </div>
      </div>
    </>
  );
}
