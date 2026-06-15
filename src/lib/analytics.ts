import { readConsent } from "@/lib/consent";

type Params = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** ID único por evento, compartilhado entre pixel e Conversions API (dedup). */
function genEventId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Dispara um evento no pixel do navegador E espelha pra Conversions API com o
 * mesmo eventID (a Meta deduplica). Só roda com consentimento concedido — sem
 * isso, o fbq nem existe e não mandamos nada pro servidor (LGPD).
 *
 * `extra` carrega dados pessoais (email/telefone) que vão SÓ pro servidor, onde
 * são hasheados — nunca entram no custom_data do pixel.
 */
function fireMeta(
  name: string,
  params: Params = {},
  extra?: { email?: string; phone?: string },
) {
  if (typeof window === "undefined") return;
  if (readConsent() !== "granted") return;

  const eventId = genEventId();
  try {
    window.fbq?.("track", name, params, { eventID: eventId });
  } catch {}

  try {
    const body = JSON.stringify({
      eventName: name,
      eventId,
      eventSourceUrl: window.location.href,
      customData: params,
      ...extra,
    });
    void fetch("/api/meta/capi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  fireMeta("PageView");
  try {
    window.gtag?.("event", "page_view", { page_path: path });
  } catch {}
}

export function trackEvent(name: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {}
}

export function trackViewContent(p: {
  id: string;
  name: string;
  category?: string;
  priceCents: number;
}) {
  if (typeof window === "undefined") return;
  const value = p.priceCents / 100;
  fireMeta("ViewContent", {
    content_ids: [p.id],
    content_name: p.name,
    content_category: p.category,
    content_type: "product",
    value,
    currency: "BRL",
  });
  try {
    window.gtag?.("event", "view_item", {
      currency: "BRL",
      value,
      items: [
        {
          item_id: p.id,
          item_name: p.name,
          item_category: p.category,
          price: value,
        },
      ],
    });
  } catch {}
}

export function trackAddToCart(p: {
  id: string;
  name: string;
  category?: string;
  priceCents: number;
  size?: string;
  qty?: number;
}) {
  if (typeof window === "undefined") return;
  const qty = p.qty ?? 1;
  const value = (p.priceCents * qty) / 100;
  fireMeta("AddToCart", {
    content_ids: [p.id],
    content_name: p.name,
    content_category: p.category,
    content_type: "product",
    value,
    currency: "BRL",
  });
  try {
    window.gtag?.("event", "add_to_cart", {
      currency: "BRL",
      value,
      items: [
        {
          item_id: p.id,
          item_name: p.name,
          item_category: p.category,
          item_variant: p.size,
          price: p.priceCents / 100,
          quantity: qty,
        },
      ],
    });
  } catch {}
}

export function trackInitiateCheckout(p: {
  ids: string[];
  value: number;
  num_items: number;
}) {
  if (typeof window === "undefined") return;
  fireMeta("InitiateCheckout", {
    content_ids: p.ids,
    content_type: "product",
    value: p.value,
    currency: "BRL",
    num_items: p.num_items,
  });
  try {
    window.gtag?.("event", "begin_checkout", {
      currency: "BRL",
      value: p.value,
    });
  } catch {}
}

export function trackContact(channel: "whatsapp" | "chat" | "form") {
  if (typeof window === "undefined") return;
  fireMeta("Contact", { channel });
  try {
    window.gtag?.("event", "contact", { method: channel });
  } catch {}
}

export function trackLead(source: string, extra?: { email?: string; phone?: string }) {
  if (typeof window === "undefined") return;
  fireMeta("Lead", { source }, extra);
  try {
    window.gtag?.("event", "generate_lead", { source });
  } catch {}
}
