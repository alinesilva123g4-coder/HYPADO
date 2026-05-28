"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function ProgressBar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setVisible(true);
    setProgress(15);

    const tick = window.setInterval(() => {
      setProgress((p) => (p < 80 ? p + (80 - p) * 0.18 : p));
    }, 120);

    timer.current = window.setTimeout(() => {
      window.clearInterval(tick);
      setProgress(100);
      window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 220);
    }, 350);

    return () => {
      window.clearInterval(tick);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [pathname, search]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="relative h-full bg-foreground origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          transition: "transform 220ms var(--ease-out-expo)",
          boxShadow:
            "0 0 8px color-mix(in srgb, var(--foreground) 60%, transparent), 0 0 2px var(--foreground)",
        }}
      >
        <span className="absolute right-0 top-0 h-full w-16 bg-gradient-to-r from-transparent to-foreground opacity-90" />
      </div>
    </div>
  );
}

export function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
