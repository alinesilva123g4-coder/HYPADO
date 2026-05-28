"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export function haptic(pattern: number | number[] = 12) {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {}
}

type Toast = {
  id: string;
  text: string;
  variant: "default" | "success";
  href?: string;
  hrefLabel?: string;
};

type ToastCtx = {
  show: (t: Omit<Toast, "id"> | string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((t: Omit<Toast, "id"> | string) => {
    const next: Toast =
      typeof t === "string"
        ? { id: crypto.randomUUID(), text: t, variant: "default" }
        : { id: crypto.randomUUID(), variant: "default", ...t };
    setToasts((prev) => [...prev.slice(-2), next]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const last = toasts[toasts.length - 1];
    const t = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== last.id));
    }, 2800);
    return () => window.clearTimeout(t);
  }, [toasts]);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {/* Stack */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[140] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-lg shadow-black/15 text-[13px] backdrop-blur-md ${
              t.variant === "success"
                ? "bg-foreground text-background border-foreground"
                : "bg-background/95 text-foreground border-line"
            }`}
            style={{ animation: "hp-toast-in 320ms cubic-bezier(.22,1,.36,1) both" }}
          >
            {t.variant === "success" && (
              <span className="h-5 w-5 rounded-full bg-background text-foreground flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
            <span className="leading-tight">{t.text}</span>
            {t.href && (
              <a
                href={t.href}
                className="text-[12px] uppercase tracking-widest underline underline-offset-4 hover:opacity-80 flex-shrink-0"
              >
                {t.hrefLabel ?? "ver"}
              </a>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return { show: () => {} } as ToastCtx;
  }
  return ctx;
}
