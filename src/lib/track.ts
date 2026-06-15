import { getSessionId } from "@/lib/session";

export type TrackEvent =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "checkout_started"
  | "lead_captured"
  | "category_view";

type Meta = Record<string, string | number | boolean | null | undefined>;

/**
 * Dispara um evento de tracking. Fire-and-forget — falha silenciosa,
 * não bloqueia UI. Usa sendBeacon quando possível pra sobreviver a
 * navegações.
 */
export function track(
  type: TrackEvent,
  opts: { productId?: string; path?: string; meta?: Meta } = {},
) {
  if (typeof window === "undefined") return;

  const payload = {
    type,
    sessionId: getSessionId(),
    path: opts.path ?? window.location.pathname,
    productId: opts.productId,
    meta: opts.meta ? JSON.stringify(opts.meta) : undefined,
  };

  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* swallow */
  }
}
